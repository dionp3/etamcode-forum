import Forum from '#models/forum'
import Post from '#models/post'
import Profile from '#models/profile'
import { FirebaseStorageService } from '#services/firebase_storage_service'
import { pictureValidator, postValidator } from '#validators/post'
import { errors } from '@adonisjs/core'
import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

export default class PostsController {
  /**
   * Display a list of resource
   */
  /**
   * @index
   * @summary List all posts
   * @description Retrieves a list of all posts that the authenticated user is authorized to view
   * @responseBody 200 - <Post[]>.with(poster, poster.user)
   * @responseBody 400 - {"message": "string", "error": "object"}
   */
  // NOT USED
  async index({ bouncer, request, response, inertia, params }: HttpContext) {
    const posts = await Post.query().has('forum', '=', params.forum_id)
    await Promise.all(posts.map((post) => post.load('poster')))
    posts.map((post) => post.poster.load('user'))

    const authorizedPosts = []

    try {
      for (const post of posts) {
        const canView = await bouncer.with('PostPolicy').allows('view', post)
        if (canView) {
          authorizedPosts.push(post)
        }
      }
      return response.json({ posts: authorizedPosts })
      // return inertia.render('posts/index', {posts: authorizedPosts})
    } catch (error) {
      throw new Exception('Something went wrong', { cause: error, status: 500 })
    }
  }

  async store({ request, response, auth }: HttpContext) {
    const profile = await Profile.findByOrFail('userId', auth.user?.id)

    const payload = await request.validateUsing(postValidator)
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
  }

  /**
   * Show individual record
   */
  /**
   * @show
   * @summary Show a specific post
   * @description Retrieves details of a specific post if the user is authorized to view it
   * @paramPath id - The ID of the post - @type(number) @required
   * @responseBody 200 - <Post>.with(poster, poster.user)
   * @responseBody 400 - {"message": "string", "error": "object"}
   * @responseBody 403 - {"message": "You cannot see this post"}
   * @responseBody 404 - Post not found
   */
  async show({ bouncer, params, response, inertia }: HttpContext) {
    try {
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
        return response.forbidden({
          message: 'You cannot see this post because the forum is restricted',
        })
      }

      if (await bouncer.with('PostPolicy').denies('show', post)) {
        // throw new Exception('You cannot see this post', { status: 403 })
        return response.forbidden({ message: 'You cannot see this post' })
      }
      return response.json({ post: post })
    } catch (error) {
      // throw new Exception('Something went wrong', { cause: error, status: 500 })
      return response.internalServerError({ message: 'Something went wrong', error: error })
    }
  }

  /**
   * Edit individual record
   */
  /**
   * @edit
   * @summary Render edit form for a post
   * @description Renders the edit form for a specific post
   * @paramPath id - The ID of the post - @type(number) @required
   * @responseBody 200 - Renders 'post/edit' Inertia page
   */
  async edit({ bouncer, params, response, inertia }: HttpContext) {
    try {
      const forum = await Forum.query()
        .where('name', '=', params.name)
        .preload('moderators', (mods) => {
          mods.orderBy('pivot_created_at', 'asc')
        })
        .preload('flairs')
        .firstOrFail()
      const post = await Post.query()
        .where('slug', '=', params.slug)
        .andWhere('forum_id', '=', forum.id)
        .preload('poster')
        .firstOrFail()

      const moderators = forum.moderators
      const forumCreator = moderators[0]
      if (await bouncer.with('ForumPolicy').denies('show', moderators, forumCreator, forum)) {
        return response.forbidden({
          message: 'You cannot edit this post because the forum is restricted',
        })
      }

      return inertia.render('post/edit', {})
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.status(404)
      }
    }
  }

  /**
   * Handle form submission for the edit action
   */
  /**
   * @update
   * @summary Update a post
   * @description Updates a specific post if the user is authorized to edit it
   * @paramPath id - The ID of the post - @type(number) @required
   * @requestBody <Post>
   * @responseBody 200 - {"message": "Post updated"}
   * @responseBody 400 - {"message": "string", "error": "object"}
   * @responseBody 403 - {"message": "You are not allowed to edit this post"}
   * @responseBody 404 - Post not found
   */
  async update({ bouncer, params, request, response, inertia }: HttpContext) {
    try {
      const payload = await request.validateUsing(postValidator)
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
      const post = await Post.query().where('forumId', forum.id).andWhere('slug', params.slug).firstOrFail()
      if (await bouncer.with('PostPolicy').denies('edit', post)) {
        return response.forbidden({ message: 'You are not allowed to edit this post' })
      }
      await post.merge(payload).save()
      return response.ok({ message: 'Post updated', payload })
    } catch (error) {
      throw new Exception('Something went wrong', { status: 500 })
    }
  }

  /**
   * Delete record
   */
  /**
   * @destroy
   * @summary Delete a post
   * @description Deletes a specific post if the user is authorized to delete it
   * @paramPath id - The ID of the post - @type(number) @required
   * @responseBody 200 - {"message": "Post deleted"}
   * @responseBody 400 - {"message": "string", "error": "object"}
   * @responseBody 403 - {"message": "You are not allowed to delete this post"}
   * @responseBody 404 - Post not found
   */
  async destroy({ bouncer, params, response }: HttpContext) {
    try {
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
      if (await bouncer.with('PostPolicy').denies('delete', post)) {
        return response.forbidden({ message: 'You are not allowed to delete this post' })
      }
      await post.merge({ isRemoved: true }).save()
      // ini ganti toRoute nya
      return response.redirect().toRoute('/')
    } catch (error) {
      throw new Exception('Something went wrong', { status: 500 })
    }
  }

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

        const profile = await Profile.query().where('userId', auth?.user?.id).firstOrFail()
        await Profile.reportPost(profile, post, reason)

        return response.ok({ message: 'Post has been reported', user: auth.user, post, forum })
      }
    } catch (error) {
      return response.internalServerError({ message: 'Something went wrong', error })
    }
  }
}
