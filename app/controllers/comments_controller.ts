import Comment from '#models/comment'
import Forum from '#models/forum'
import Post from '#models/post'
import { createCommentValidator, editCommentValidator } from '#validators/comment'
import type { HttpContext } from '@adonisjs/core/http'
import filter from '#services/filter_bad_words'

export default class CommentsController {
  /**
   * @index
   * @summary List of comments for admin page
   * @responseBody 200 - <Comment[]>.with(creator)
   * @tag Admin
   * @responseBody 400 - {"message": "Bad request", "error": "object"}
   * @responseBody 500 - {"message": "Failed to load related data", "error": "object"}
   */
  async index({ bouncer, response }: HttpContext) {
    try {
      if (await bouncer.with('CommentPolicy').denies('index')) {
        return response.forbidden({ message: 'You are not allowed here' })
      }
      let comments: Comment[]
      try {
        comments = await Comment.all()
        comments.map(async (comment) => await comment.load('creator'))
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
   * @store
   * @summary Handles form submission
   * @tag Comments
   * @requestBody {"content": "string", "postId": 1, "creatorId": 1}
   * @responseBody 201 - {"message": "Comment posted", "data": <Comment>}
   */
  async store({ bouncer, request, response, auth, params }: HttpContext) {
    // const payload = await createCommentValidator.validate(request.body())
    if (!auth.user) return response.unauthorized({ message: 'You must be logged in to create a comment' })
    const payload = await request.validateUsing(createCommentValidator)
    payload.content = filter.clean(payload.content)
    if (payload.parentCommentId) {
      //const parentComment = await Comment.query().where('id', payload.parentCommentId?.toString()).firstOrFail()
      //if (await bouncer.with('CommentPolicy').denies('reply', parentComment)) {
      //  return response.forbidden({ message: 'You cannot reply to this comment' })
      //}
    }
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
    const comment = await Comment.create({
      postId: post.id,
      creatorId: auth.user.id,
      content: payload.content,
      parentCommentId: payload.parentCommentId,
    })
    return response.created({ message: 'Comment posted', data: comment })
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
   * @update
   * @summary Handles edit submission
   * @tag Comments
   * @requestBody {"content": "string"}
   * @responseBody 200 - {"message": "Comment updated", "data": <Comment>}
   */
  async update({ bouncer, params, request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(editCommentValidator)
      const forum = await Forum.query()
        .where('name', params.name)
        .preload('moderators', (mods) => mods.orderBy('pivot_created_at', 'asc'))
        .firstOrFail()
      const moderators = forum.moderators

      payload.content = filter.clean(payload.content)

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
        return response.forbidden({ message: "You aren't allowed to edit this comment" })
      }
      await comment.merge(payload).save()
      return response.ok({ message: 'Comment updated', data: comment })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ message: 'Data not found', error: error })
      }
      if (error.messages) {
        return response.unprocessableEntity({ message: 'Validation error', error: error })
      }
      return response.badRequest({ message: 'Bad request', error: error })
    }
  }

  /**
   * @destroy
   * @summary Deletes the record
   * @tag Comments
   * @responseBody 200 - {"message": "Comment deleted"}
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
      }
      return response.badRequest({ message: 'Bad request', error: error })
    }
  }
}
