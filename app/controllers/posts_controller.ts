import Post from '#models/post'
import type Comment from '#models/comment'
import { pictureValidator, sortPostValidator, storePostValidator } from '#validators/post'
import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import type { ModelPaginatorContract } from '@adonisjs/lucid/types/model'
import { FirebaseStorageService } from '#services/firebase_storage_service'
import Profile from '#models/profile'
import Forum from '#models/forum'

export default class PostsController {
  /**
   * @index
   * @summary List all posts
   * @tag Posts
   * @description Retrieves a list of all posts that the authenticated user is authorized to view
   * @responseBody 200 - <Post[]>.with(poster, poster.user, forum)
   * @responseBody 400 - {"message": "string", "error": "object"}
   */
  async index({ bouncer, request, inertia }: HttpContext) {
    // TODO: For each HTTP method that queries posts, add logic to exclude posts where isRemoved = true
    // unless the user is a moderator or admin

    const page = request.input('page', 1)
    const perPage = request.input('per_page', 20)
    const { sort_by, order } = await request.validateUsing(sortPostValidator)

    const postQuery: ModelPaginatorContract<Post> = await Post.query()
      .preload('poster', (posterQuery) => posterQuery.preload('user'))
      .preload('forum')
      .orderBy(sort_by || 'poster_id', order || 'asc')
      .paginate(page, perPage)

    const authorizedPosts = (
      await Promise.all(
        postQuery.map(async (post) => {
          const canView = await bouncer.with('PostPolicy').allows('view', post)
          return canView ? post : null
        })
      )
    ).filter(Boolean) as Post[]

    return inertia.render('posts/index', {
      posts: authorizedPosts,
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
  async show({ bouncer, params, inertia }: HttpContext) {
    const forum = await Forum.query()
      .where('name', params.name)
      .preload('moderators', (mods) => {
        mods.orderBy('pivot_created_at', 'asc')
      })
      .firstOrFail()
    const post = await Post.query()
      .where('slug', '=', params.slug)
      .andWhere('forum_id', '=', forum.id)
      .preload('poster', (query) => query.preload('user'))
      .firstOrFail()

    const moderators = forum.moderators
    const forumCreator = moderators[0]

    if (await bouncer.with('ForumPolicy').denies('show', moderators, forumCreator, forum)) {
      // return response.forbidden({
      //   message: 'You cannot see this post because the forum is restricted',
      // })
      throw new Exception('Forum is restricted', { status: 403 })
    }
    if (await bouncer.with('PostPolicy').denies('show', post)) {
      throw new Exception('Page Not Found', { status: 404, code: 'E_ROUTE_NOT_FOUND' })
    }

    const comments: Comment[] = await post.getComments()

    return inertia.render('posts/show', { post, comments })
  }

  /**
   * @create
   * @summary Render create form for a post
   * @tag Posts
   * @description Renders the create form for a specific forum
   * @paramPath name - The name of the forum - @type(string) @required
   * @responseBody 200 - Renders 'posts/create' Inertia page
   */
  async create({ bouncer, params, response, inertia }: HttpContext) {
    const { name } = params

    if (!name) {
      return inertia.render('posts/create')
    }
    // Find the forum by name
    const forum = await Forum.query()
      .where('name', name)
      .preload('moderators', (modsQuery) => modsQuery.orderBy('pivot_created_at', 'asc'))
      .firstOrFail()

    const moderators = forum.moderators
    const creator = moderators[0]

    // Authorization check: Only moderators or admins can create posts
    const canCreate = await bouncer.with('ForumPolicy').allows('show', moderators, creator, forum)
    if (!canCreate) {
      return response.forbidden({ message: 'Forum is restricted' })
    }

    return inertia.render('posts/create', { forum })
  }

  /**
   * @store
   * @summary Create a post
   * @tag Posts
   * @requestBody {"title": "Lorem", "content": "Lorem", "forumId": 1, "flairId": 1}
   * @responseBody 201 - <Post>
   */
  async store({ request, response, auth }: HttpContext) {
    try {
      const profile = await Profile.findByOrFail('userId', auth.user?.id)

      const payload = await request.validateUsing(storePostValidator)
      const file = await request.validateUsing(pictureValidator)

      const firebaseStorage = new FirebaseStorageService()

      let imageUrl = null
      let hasImage = false
      if (file?.imageUrl && auth.user) {
        imageUrl = await firebaseStorage.uploadPostImage(file.imageUrl, auth.user)
        hasImage = true
      }

      // Create the post
      const post = await Post.create({
        ...payload,
        posterId: profile.userId,
        imageUrl: imageUrl,
        hasImage: hasImage,
      })

      return response.created(post)
    } catch (error) {
      console.error(error)
      return response.internalServerError({ message: 'Something went wrong', error: error.message })
    }
  }

  /**
   * @edit
   * @summary Render edit form for a post
   * @tag Posts
   * @description Renders the edit form for a specific post
   * @paramPath name - The name of the forum - @type(string) @required
   * @paramPath slug - The slug of the post - @type(string) @required
   * @responseBody 200 - Renders 'posts/edit' Inertia page
   */
  async edit({ bouncer, params, inertia, response }: HttpContext) {
    const { name, slug } = params

    try {
      // Find the forum by name
      const forum = await Forum.findByOrFail('name', name)

      // Find the post by slug within the forum
      const post = await Post.query().where('forum_id', forum.id).where('slug', slug).firstOrFail()

      // Authorization check: Only authorized users can edit
      const canEdit = await bouncer.with('PostPolicy').allows('edit', post)
      if (!canEdit) {
        return response.forbidden({ message: 'You are not allowed to edit this post' })
      }

      return inertia.render('posts/edit', { post, forum })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ message: 'Post not found' })
      }
      if (error.status === 403) {
        return response.forbidden({ message: error.message })
      }
      return response.internalServerError({ message: 'An error occurred', error: error.message })
    }
  }

  /**
   * @update
   * @summary Update a post
   * @tag Posts
   * @description Updates a specific post if the user is authorized to edit it
   * @paramPath name - The name of the forum - @type(string) @required
   * @paramPath slug - The slug of the post - @type(string) @required
   * @requestBody <Post>
   * @responseBody 200 - {"message": "Post updated", "data": <Post>}
   * @responseBody 400 - {"message": "string", "error": "object"}
   * @responseBody 403 - {"message": "You are not allowed to edit this post"}
   * @responseBody 404 - Post not found
   */
  async update({ bouncer, params, request, response, inertia }: HttpContext) {
    const payload = await request.validateUsing(storePostValidator)
    const forum = await Forum.query()
      .where('name', params.name)
      .preload('moderators', (mods) => mods.orderBy('pivot_created_at', 'asc'))
      .firstOrFail()
    const moderators = forum.moderators
    if (await bouncer.with('ForumPolicy').denies('show', moderators, moderators[0], forum)) {
      return response.forbidden({
        message: 'You cannot edit this post because the forum is restricted',
      })
    }
    const post = await Post.query()
      .where('forumId', forum.id)
      .andWhere('slug', params.slug)
      .preload('poster', (poster) => poster.preload('user'))
      .firstOrFail()
    try {
      // Authorization check
      const canEdit = await bouncer.with('PostPolicy').allows('edit', post)
      if (!canEdit) {
        return response.forbidden({ message: 'You are not allowed to edit this post' })
      }

      // Validate the incoming request
      const file = await request.validateUsing(pictureValidator)

      const firebaseStorage = new FirebaseStorageService()

      let imageUrl = post.imageUrl
      let hasImage = post.hasImage

      if (file?.imageUrl && request.file('imageUrl')) {
        imageUrl = await firebaseStorage.uploadPostImage(file.imageUrl, post.poster.user)
        hasImage = true
      }

      // Update the post
      post.merge({
        ...payload,
        imageUrl: imageUrl,
        hasImage: hasImage,
      })

      await post.save()

      return response.ok({ message: 'Post updated', data: post })
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
    const post = await Post.query()
      .where('forumId', forum.id)
      .andWhere('slug', params.slug)
      .firstOrFail()
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

        const profile = await Profile.query().where('userId', auth!.user!.id).firstOrFail()
        await Profile.reportPost(profile, post, reason)

        return response.ok({ message: 'Post has been reported', user: auth.user, post, forum })
      }
    } catch (error) {
      return response.internalServerError({ message: 'Something went wrong', error })
    }
  }
}
