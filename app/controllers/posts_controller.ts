import Post from '#models/post'
import { sortPostValidator, postValidator } from '#validators/post'
import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import { FirebaseStorageService } from '#services/firebase_storage_service'
import Profile from '#models/profile'
import Forum from '#models/forum'
//import sharp from 'sharp' // library for image resizing
import filter from '#services/filter_bad_words'
import db from '@adonisjs/lucid/services/db'
type SerializedComment = {
  id: number
  slug: string
  content: string
  createdAt: string
  displayName: string
  username: string
  avatarUrl: string
  replies: SerializedComment[]
}

export default class PostsController {
  /**
   * @index
   * @summary List all posts
   * @tag Posts
   * @description Retrieves a list of all posts that the authenticated user is authorized to view
   * @responseBody 200 - <Post[]>.with(poster, poster.user, forum)
   * @responseBody 400 - {"message": "string", "error": "object"}
   */
  async index({ bouncer, request, inertia, auth }: HttpContext) {
    const { sort_by, order } = await request.validateUsing(sortPostValidator)

    const postQuery = await Post.query()
      .select('id', 'posterId', 'title', 'content', 'forumId', 'slug', 'imageUrl', 'createdAt', 'isRemoved')
      .where('isRemoved', false)
      .preload('poster', (posterQuery) =>
        posterQuery.select('displayName', 'userId').preload('user', (userQuery) => userQuery.select('username')),
      )
      .withCount('comments', (commentsQuery) => commentsQuery.where('isRemoved', false))
      .preload('forum', (forumQuery) =>
        forumQuery.select('name', 'iconId').preload('icon', (iconQuery) => iconQuery.select('url')),
      )
      .orderBy(sort_by || 'createdAt', order || 'desc')
      .paginate(request.input('page', 1), 20)

    const getPosts = async () =>
      await Promise.all(
        postQuery.map(async (post) => {
          if (!(await bouncer.with('PostPolicy').allows('view', post))) return null
          const userVoteScore: number = auth.user
            ? await db
                .from('post_likes')
                .select('score')
                .where('post_id', post.id)
                .andWhere('profile_id', auth.user.id)
                .first()
                .then((vote) => (vote ? vote.score : 0))
                .catch(() => 0)
            : 0

          return {
            title: filter.clean(post.title),
            content: post.content ? filter.clean(post.content) : null,
            imageUrl: post.imageUrl,
            slug: post.slug,
            displayName: post.poster.displayName,
            username: post.poster.user.username,
            forumName: post.forum.name,
            avatarUrl: post.forum.icon.url,
            createdAt: post.createdAt.toString(),
            totalScore: '0',
            totalComments: post.$extras.comments_count,
            userVoteScore: userVoteScore,
          }
        }),
      ).then((posts) => posts.filter((post) => post !== null))

    return inertia.render('home', {
      posts: inertia.defer(getPosts).merge(),
      paginate: postQuery.getMeta(),
    })
  }

  /**
   * @show
   * @summary Show a specific post
   * @tag Posts
   * @description Retrieves details of a specific post if the user is authorized to view it
   * @paramPath name - The name of the forum - @type(string) @required
   * @paramPath slug - The slug of the post - @type(string) @required
   * @responseBody 200 - <Post>.with(poster, poster.user, forum, comments)
   * @responseBody 400 - {"message": "string", "error": "object"}
   * @responseBody 403 - {"message": "You cannot see this post"}
   * @responseBody 404 - Post not found
   */
  async show({ bouncer, params, inertia, request, auth }: HttpContext) {
    const user = auth.user
    const forum = await Forum.query()
      .where('name', params.name)
      .preload('moderators', (mods) => {
        mods.orderBy('pivot_created_at', 'asc')
      })
      .firstOrFail()

    const forumCreator = forum.moderators[0]
    // validate if the forum is breaking policy
    if (await bouncer.with('ForumPolicy').denies('show', forum.moderators, forumCreator, forum)) {
      throw new Exception('Forum is restricted', { status: 403 })
    }

    // query for post
    const post = await forum
      .related('posts')
      .query()
      .where('slug', params.slug)
      .select(
        'id',
        'posterId',
        'title',
        'content',
        'forumId',
        'slug',
        'imageUrl',
        'createdAt',
        'isRemoved',
        'id',
        'flairId',
      )
      .where('isRemoved', false)
      .firstOrFail()

    if (await bouncer.with('PostPolicy').denies('show', post)) {
      throw new Exception('Page Not Found', { status: 404, code: 'E_ROUTE_NOT_FOUND' })
    }

    const getPost = async () => {
      await post.load('poster', (posterQuery) =>
        posterQuery.select('displayName', 'userId').preload('user', (userQuery) => userQuery.select('username')),
      )
      await forum.load('icon', (iconQuery) => iconQuery.select('url'))
      await post.loadCount('voters')

      await post.load('flair', (flairQuery) => flairQuery.select('name', 'color'))
      await post.loadCount('comments', (commentsQuery) => commentsQuery.where('isRemoved', false))
      const userVoteScore: number = user
        ? await db
            .from('post_likes')
            .select('score')
            .where('post_id', post.id)
            .andWhere('profile_id', user.id)
            .first()
            .then((vote) => (vote ? vote.score : 0))
            .catch(() => 0)
        : 0

      return {
        title: filter.clean(post.title),
        content: post.content ? filter.clean(post.content) : null,
        imageUrl: post.imageUrl,
        slug: post.slug,
        displayName: post.poster.displayName,
        username: post.poster.user.username,
        forumName: forum.name,
        avatarUrl: forum.icon.url,
        createdAt: post.createdAt.toString(),
        totalScore: post.$extras.voters_count,
        totalComments: post.$extras.comments_count,
        flair: post.flair,
        userVoteScore: userVoteScore,
      }
    }

    const comments = await post
      .related('comments')
      .query()
      .where('isDeleted', false)
      .orderBy('created_at', 'desc')
      .preload('creator', (creatorQuery) =>
        creatorQuery
          .select('userId', 'avatarId', 'displayName')
          .preload('user', (userQuery) => userQuery.select('username'))
          .preload('avatar', (avatarQuery) => avatarQuery.select('url')),
      )
      .withAggregate('voters', (query) => {
        query.sum('score').as('totalScore')
      })
      .paginate(request.input('page', 1), 20)

    const buildCommentTree = async () => {
      const commentMap: Map<number, SerializedComment> = new Map()
      const roots: SerializedComment[] = []

      for (const comment of comments) {
        const userHasLiked = user
          ? await db
              .from('comment_likes')
              .select('score')
              .where('comment_id', comment.id)
              .andWhere('profile_id', user.id)
              .first()
              .then((vote) => (vote ? vote.score : 0))
              .catch(() => 0)
          : 0

        //const totalScore = await db
        //  .from('comment_likes')
        //  .where('comment_id', comment.id)
        //  .sum('score as total')
        //  .first()
        //  .then((result) => result?.total || 0)
        //  .catch(() => 0)
        commentMap.set(comment.id, {
          id: comment.id,
          slug: comment.slug,
          content: comment.content,
          createdAt: comment.createdAt.toString(),
          displayName: comment.creator.displayName || comment.creator.user.username,
          username: comment.creator.user.username,
          avatarUrl: comment.creator.avatar?.url,
          replies: [],
          userHasLiked,
          totalScore: comment.$extras.totalScore,
        } as SerializedComment)
      }

      for (const comment of comments) {
        const serializedComment = commentMap.get(comment.id)
        if (!serializedComment) continue
        if (comment.parentCommentId) {
          const parentComment = commentMap.get(comment.parentCommentId)
          if (parentComment) {
            parentComment.replies.push(serializedComment)
          }
        } else {
          roots.push(serializedComment)
        }
      }

      return roots
    }

    //return inertia.render('posts/show', {
    //  post: await getPost(),
    //  comments: await buildCommentTree(),
    //  paginate: comments.getMeta(),
    //})
    return inertia.render('posts/show', {
      post: inertia.defer(getPost),
      comments: inertia.defer(buildCommentTree).merge(),
      paginate: comments.getMeta(),
    })
  }

  /**
   * @create
   * @summary Render create form for a post
   * @tag Posts
   * @description Renders the create form for a specific forum
   * @paramPath name - The name of the forum - @type(string) @required
   * @responseBody 200 - <Forum>.with(flairs)
   */
  async create({ params, inertia }: HttpContext) {
    if (!params.name) {
      return inertia.render('posts/create')
    }
    return inertia.render('posts/create', { forumName: params.name })
  }

  /**
   * @store
   * @summary Create a post
   * @tag Posts
   * @requestBody <Post>.exclude(poster_id, has_image, created_at, updated_at, slug, is_removed, is_locked)
   * @responseBody 201 - <Post>
   */
  async store({ request, response, auth }: HttpContext) {
    // Authenticate user
    const user = auth.user
    if (!user) {
      throw new Exception('User not authenticated', { status: 401 })
    }

    // Validate incoming post data
    const payload = await request.validateUsing(postValidator)
    if (!('forumName' in payload)) {
      throw new Exception('Forum name is required', { status: 400 })
    }
    let { title, content, flairId, forumName, imageFile } = payload
    title = filter.clean(title)
    content = content ? filter.clean(content) : undefined

    // Initialize Firebase storage service
    const firebaseStorage = new FirebaseStorageService()

    // Initialize firebaseImageUrl to null by default
    let firebaseImageUrl: string | null = null

    // Conditionally handle image upload
    if (imageFile?.tmpPath) {
      try {
        // Resize the image before uploading
        //const resizedImageData = await sharp(imageUrl.tmpPath).resize(500).toFormat('jpeg', { mozjpeg: true }).toBuffer()
        firebaseImageUrl = await firebaseStorage.uploadPostImage(imageFile, user) // Ensure uploadPostImage uses the resized image
      } catch (uploadError) {
        //return response.internalServerError({ message: 'Image upload failed.' })
        throw new Exception('Image upload failed.', { status: 500 })
      }
    }
    // Extract forum name from route parameters
    const forum = await Forum.query().where('name', forumName).select('id').firstOrFail()

    // Create the post with the provided data
    const post = await Post.create({
      forumId: forum.id, // Ensure forumId is correctly handled elsewhere
      posterId: user.id,
      flairId,
      title, // Include the title
      content, // Include the content
      imageUrl: firebaseImageUrl || null, // Handle the image URL properly
    })

    return response.redirect().toRoute('f.posts.show', { name: forumName, slug: post.slug })
  }

  /**
   * @edit
   * @summary Render edit form for a post
   * @tag Posts
   * @description Renders the edit form for a specific post
   * @paramPath name - The name of the forum - @type(string) @required
   * @paramPath slug - The slug of the post - @type(string) @required
   * @responseBody 200 - <Post>.exclude(poster_id, has_image, created_at, updated_at, slug, is_removed, is_locked, forum_id)
   */
  async edit({ bouncer, params, inertia, response }: HttpContext) {
    const { name, slug } = params

    // Find the post by slug within the forum
    const post = await Post.query()
      .where('slug', slug)
      .select('title', 'content', 'flairId', 'imageUrl', 'posterId')
      .preload('flair')
      .firstOrFail()

    // Authorization check: Only authorized users can edit
    const canEdit = await bouncer.with('PostPolicy').allows('edit', post)
    if (!canEdit) {
      return response.forbidden({ message: 'You are not allowed to edit this post' })
    }

    const forum = await Forum.query()
      .where('name', name)
      .select('id', 'iconId')
      .preload('icon', (iconQuery) => iconQuery.select('url'))
      .preload('flairs', (flairQuery) => flairQuery.select('name', 'color', 'id'))
      .firstOrFail()

    return inertia.render('posts/edit', {
      post: {
        title: post.title,
        slug: slug as string,
        content: post.content,
        flair: post.flair ? { name: post.flair.name, color: post.flair.color, id: post.flair.id } : null,
        imageUrl: post.imageUrl,
      },
      forum: {
        name: name as string,
        iconUrl: forum?.icon?.url,
        flairs: forum.flairs.map((flair) => ({
          name: flair.name,
          id: flair.id,
          color: flair.color,
        })),
      },
    })
  }

  /**
   * @update
   * @summary Update a post
   * @tag Posts
   * @description Updates a specific post if the user is authorized to edit it
   * @paramPath name - The name of the forum - @type(string) @required
   * @paramPath slug - The slug of the post - @type(string) @required
   * @requestBody <Post>.exclude(poster_id, has_image, created_at, updated_at, slug, is_removed, is_locked, forum_id)
   * @responseBody 200 - {"message": "Post updated", "data": <Post>}
   * @responseBody 400 - {"message": "string", "error": "object"}
   * @responseBody 403 - {"message": "You are not allowed to edit this post"}
   * @responseBody 404 - Post not found
   */
  async update({ auth, params, request, response }: HttpContext) {
    // Authenticate user
    const user = auth.user
    if (!user) {
      throw new Exception('User not authenticated', { status: 401 })
    }
    const { name, slug } = params
    const post = await Post.findByOrFail('slug', slug)
    if (user.id !== post.posterId) {
      throw new Exception('You are not allowed to edit this post', { status: 403 })
    }

    // Validate incoming post data
    const payload = await request.validateUsing(postValidator)
    if (!('imageRemoved' in payload)) {
      throw new Exception('missing required data', { status: 400 })
    }
    const { title, content, flairId, imageRemoved, imageFile } = payload

    let imageUrl = imageRemoved ? null : post.imageUrl

    // Initialize Firebase storage service
    const firebaseStorage = new FirebaseStorageService()

    // Initialize firebaseImageUrl to null by default

    // Conditionally handle image upload
    if (imageFile?.tmpPath) {
      try {
        // Resize the image before uploading
        //const resizedImageData = await sharp(imageUrl.tmpPath).resize(500).toFormat('jpeg', { mozjpeg: true }).toBuffer()
        imageUrl = await firebaseStorage.uploadPostImage(imageFile, user) // Ensure uploadPostImage uses the resized image
      } catch (uploadError) {
        throw new Exception('Image upload failed.', { status: 500 })
      }
    }
    await post
      .merge({
        flairId: flairId,
        title: title, // Include the title
        content: content, // Include the content
        imageUrl, // Handle the image URL properly
      })
      .save()

    return response.redirect().clearQs().toRoute('f.posts.show', { name: name, slug: slug })
  }

  /**
   * @destroy
   * @summary Delete a post
   * @tag Posts
   * @description Deletes a specific post if the user is authorized to delete it
   * @paramPath name - The name of the forum - @type(string) @required
   * @paramPath slug - The slug of the post - @type(string) @required
   * @responseBody 200 - {"message": "Post deleted"}
   * @responseBody 400 - {"message": "string", "error": "object"}
   * @responseBody 403 - {"message": "You are not allowed to delete this post"}
   * @responseBody 404 - Post not found
   */
  async destroy({ bouncer, params, response }: HttpContext) {
    const forum = await Forum.query()
      .where('name', params.name)
      .preload('moderators', (mods) => mods.orderBy('pivot_created_at', 'asc'))
      .firstOrFail()
    const moderators = forum.moderators
    if (await bouncer.with('ForumPolicy').denies('show', moderators, moderators[0], forum)) {
      return response.forbidden({
        message: 'You cannot delete this post because the forum is restricted',
      })
    }
    const post = await Post.query().where('forumId', forum.id).andWhere('slug', params.slug).firstOrFail()
    try {
      // Authorization check
      const canDelete = await bouncer.with('PostPolicy').allows('delete', post)
      if (!canDelete) {
        return response.forbidden({ message: 'You are not allowed to delete this post' })
      }
      await post.merge({ isRemoved: true }).save()
      return response.ok({ message: 'Post deleted' })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ message: 'Post not found' })
      }
      if (error.status === 403) {
        return response.forbidden({ message: error.message })
      }
      return response.badRequest({ message: 'Bad request', error: error.message })
    }
  }

  /**
   * @reportPost
   * @summary Report a post
   * @tag Posts
   * @requestBody {"reason": "Lorem"}
   * @responseBody 200 - {"message": "Post has been reported", "user": <User>, "post": <Post>, "forum": <Forum>}
   */
  async reportPost({ bouncer, response, params, request, auth }: HttpContext) {
    try {
      if (request.method() === 'POST') {
        const forum = await Forum.query()
          .where('name', params.name)
          .preload('moderators', (mods) => mods.orderBy('pivot_created_at', 'asc'))
          .firstOrFail()
        const moderators = forum.moderators
        if (await bouncer.with('ForumPolicy').denies('show', moderators, moderators[0], forum)) {
          return response.forbidden({
            message: 'You cannot delete this post because the forum is restricted',
          })
        }
        const post = await Post.query().where('slug', params.post_slug).firstOrFail()
        if (await bouncer.with('PostPolicy').denies('report', post)) {
          return response.forbidden({ message: 'You are not allowed to report this post' })
        }

        if (await bouncer.with('PostPolicy').denies('show', post)) {
          return response.forbidden({ message: 'You are not allowed to delete this post' })
        }

        const { reason } = request.body()
        if (!auth.user?.id) {
          throw new Exception('User not found', { status: 404 })
        }
        const profile = await Profile.query().where('userId', auth.user.id).firstOrFail()
        await Profile.reportPost(profile, post, reason)

        return response.ok({ message: 'Post has been reported', user: auth.user, post, forum })
      }
    } catch (error) {
      return response.internalServerError({ message: 'Something went wrong', error })
    }
  }
}
