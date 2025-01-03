import Comment from '#models/comment'
import Forum from '#models/forum'
import Post from '#models/post'
import Profile from '#models/profile'
import { createCommentValidator, editCommentValidator } from '#validators/comment'
import type { HttpContext } from '@adonisjs/core/http'

export default class CommentsController {
  /**
   * Display a list of resource
   */
  /**
   * @index
   * @summary Not used
   * @responseBody 200 - <Comment[]>.with(creator)
   * @responseBody 400 - {"message": "Bad request", "error": "object"}
   * @responseBody 500 - {"message": "Failed to load related data", "error": "object"}
   */
  async index({ bouncer, response }: HttpContext) {
    try {
      if (await bouncer.with('CommentPolicy').denies('index')) {
        return response.forbidden({ message: 'You are not allowed here' })
      }
      let comments
      try {
        comments = await Comment.all()
        await Promise.all(comments.map((comment) => comment.load('creator')))
      } catch (dataFetchError) {
        return response.internalServerError({
          message: 'Failed to load related data',
          error: dataFetchError,
        })
      }

      return response.json({ comments: comments })
    } catch (error) {
      return response.badRequest({ message: 'Bad request', error: error })
    }
  }

  /**
   * Handle form submission for the create action
   */
  async store({ bouncer, params, request, response, auth }: HttpContext) {
    try {
      // const payload = await createCommentValidator.validate(request.body())
      const payload = await request.validateUsing(createCommentValidator)

      // const userProfile = await Profile.query().where('user_id', userId).firstOrFail()

      const forum = await Forum.query()
        .where('name', params.name)
        .preload('moderators', (mods) => mods.orderBy('pivot_created_at', 'asc'))
        .firstOrFail()

      const moderators = forum.moderators
      if (await bouncer.with('ForumPolicy').denies('show', moderators, moderators[0], forum)) {
        return response.forbidden({ message: 'You cannot create a comment in this forum' })
      }

      const post = await Post.query().where('slug', params.post_slug).firstOrFail()
      if (await bouncer.with('PostPolicy').denies('show', post)) {
        return response.forbidden({ message: 'You cannot create a comment in this post' })
      }

      if (await bouncer.with('CommentPolicy').denies('create')) {
        return response.forbidden({ message: 'You are not allowed to create a comment' })
      }

      const comment = await Comment.create(payload)

      return response.created({ message: 'Comment posted', data: comment })
    } catch (error) {
      if (error.messages) {
        return response.unprocessableEntity({ message: 'Validation error', error: error })
      }
      return response.badRequest({ message: 'Bad request', error: error.messages })
    }
  }

  /**
   * Show individual record
   */
  async show({ params }: HttpContext) {}

  /**
   * Edit individual record
   */
  // async edit({ params }: HttpContext) {}

  /**
   * Handle form submission for the edit action
   */
  async update({ bouncer, params, request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(editCommentValidator)
      const forum = await Forum.query()
        .where('name', params.name)
        .preload('moderators', (mods) => mods.orderBy('pivot_created_at', 'asc'))
        .firstOrFail()
      const moderators = forum.moderators

      if (await bouncer.with('ForumPolicy').denies('show', moderators, moderators[0], forum)) {
        return response.forbidden({
          message: 'You cannot edit this comment because the forum is restricted',
        })
      }

      const post = await Post.query().where('slug', params.post_slug).firstOrFail()
      if (await bouncer.with('PostPolicy').denies('show', post)) {
        return response.forbidden({
          message: 'You cannot edit this comment because the forum is restricted',
        })
      }

      const comment = await Comment.query().where('slug', params.slug).firstOrFail()
      if (await bouncer.with('CommentPolicy').denies('edit', comment)) {
        return response.forbidden({ message: 'You cannot edit this comment' })
      }

      await comment.merge(payload).save()
      return response.ok({ message: 'Comment updated', data: comment })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ message: 'Data not found', error: error })
      } else if (error.messages) {
        return response.unprocessableEntity({ message: 'Validation error', error: error })
      } else {
        return response.badRequest({ message: 'Bad request', error: error })
      }
    }
  }

  /**
   * Delete record
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
          message: 'You cannot delete this comment because the forum is restricted',
        })
      }

      const post = await Post.query().where('slug', params.post_slug).firstOrFail()
      if (await bouncer.with('PostPolicy').denies('show', post)) {
        return response.forbidden({
          message: 'You are not allowed to delete this comment because the post is restricted',
        })
      }

      const comment = await Comment.query().where('slug', params.slug).firstOrFail()
      if (await bouncer.with('CommentPolicy').denies('delete', comment)) {
        return response.forbidden({ message: "You aren't allowed to delete this comment" })
      }

      await Comment.query().where('parent_comment_id', comment.id).delete()
      await comment.delete()
      return response.ok({ message: 'Comment deleted', data: comment })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ message: 'Data not found', error: error })
      } else {
        return response.badRequest({ message: 'Bad request', error: error })
      }
    }
  }

  async reportComment({ bouncer, params, response, request, auth }: HttpContext) {
    try {
      const forum = await Forum.query()
        .where('name', params.name)
        .preload('moderators', (mods) => mods.orderBy('pivot_created_at', 'asc'))
        .firstOrFail()
      const moderators = forum.moderators
      if (await bouncer.with('ForumPolicy').denies('show', moderators, moderators[0], forum)) {
        return response.forbidden({
          message: 'You cannot delete this comment because the forum is restricted',
        })
      }

      const post = await Post.query().where('slug', params.post_slug).firstOrFail()
      if (await bouncer.with('PostPolicy').denies('show', post)) {
        return response.forbidden({
          message: 'You are not allowed to delete this comment because the post is restricted',
        })
      }

      const comment = await Comment.query().where('slug', params.slug).firstOrFail()
      if (await bouncer.with('CommentPolicy').denies('delete', comment)) {
        return response.forbidden({ message: "You aren't allowed to delete this comment" })
      }

      // TODO : Fix authz
      if (await bouncer.with('CommentPolicy').denies('report')) {
        return response.forbidden({ message: 'You are not allowed to report this comment' })
      }

      const { reason } = request.body()

      const profile = await Profile.query().where('userId', auth.user.id).firstOrFail()
      await Profile.reportComment(profile, comment, reason)
      return response.ok({ message: 'Comment reported' })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ message: 'Data not found', error: error })
      } else {
        return response.badRequest({ message: 'Bad request', error: error })
      }
    }
  }
}
