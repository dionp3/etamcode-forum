import Flair from '#models/flair'
import Forum from '#models/forum'
import { createFlairValidator } from '#validators/flair'
import type { HttpContext } from '@adonisjs/core/http'

export default class FlairsController {
  /**
   * @index
   * @summary Page list of flairs in a forum
   * @tag Flairs
   * @responseBody 200 - <Forum>.with(flairs)
   * @responseBody 404 - {"message": 'No flairs'}
   * @responseBody 400 - {"message": 'Bad request', "error": "object"}
   */
  async index({ params, response, inertia }: HttpContext) {
    try {
      const forum = await Forum.findByOrFail('name', params.name)
      const forumWithFlairs = await forum.related('flairs').query()
      // return response.json({ data: forumWithFlairs })
      return inertia.render('flairs/index', { forum: forum, flairs: forumWithFlairs })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.ok({ message: 'No flairs', data: {} })
      }
      return response.badRequest({ message: 'Bad request', error: error })
    }
  }

  /**
   *
   * @create
   * @summary Renders page to create flair in forum
   * @tag Flairs
   */
  async create({ request, response, inertia, params, bouncer }: HttpContext) {
    const forum = await Forum.findByOrFail('name', params.name)
    const moderators = await forum.related('moderators').query()
    if (await bouncer.with('FlairPolicy').denies('create', moderators)) {
      return response.redirect().toPath(`/f/${forum.name}`)
    }
    return inertia.render('flairs/create', { forum: { id: forum.id, name: forum.name } })
  }

  /**
   * @store
   * @summary Store flair to the forum
   * @tag Flairs
   * @responseBody 201 - {"message": 'Flair created', "data": <Flair>}
   * @responseBody 400 - {"message": 'Bad request', "error": "error"}
   */
  async store({ bouncer, params, request, response }: HttpContext) {
    try {
      const forum = await Forum.findByOrFail('name', params.name)
      const moderators = await forum.related('moderators').query()
      if (await bouncer.with('FlairPolicy').denies('create', moderators)) {
        return response.forbidden({ message: 'You are not allowed to add flairs' })
      }
      const payload = await request.validateUsing(createFlairValidator)
      const flair = await Flair.create(payload)
      return response.redirect().toPath(`/f/${forum.name}/flairs`)
    } catch (error) {
      return response.badRequest({ message: 'Bad request', error: error })
    }
  }

  /**
   * Show individual record
   */
  async show({ params }: HttpContext) {}

  async edit({ params, bouncer, response, inertia }: HttpContext) {
    const forum = await Forum.findByOrFail('name', params.name)
    const moderators = await forum.related('moderators').query()
    if (await bouncer.with('FlairPolicy').denies('create', moderators)) {
      return response.forbidden({ message: 'You are not allowed to add flairs' })
    }
    const flair = await Flair.findByOrFail('id', params.id)
    return inertia.render('flairs/edit', {
      forum: { id: forum.id, name: forum.name },
      flair: { id: flair.id, name: flair.name, color: flair.color },
    })
  }

  /**
   * @update
   * @summary Update the flair in the forum
   * @tag Flairs
   * @responseBody 200 - {"message": "string", "data": <Flair>}
   * @responseBody 404 - {message: string, error: object}
   * @responseBody 422 - {message: string, error: object}
   * @responseBody 500 - {message: string, error: object}
   */
  async update({ bouncer, params, request, response }: HttpContext) {
    try {
      const forum = await Forum.findByOrFail('name', params.name)
      const flair = await Flair.findByOrFail('id', params.id)
      const moderators = await forum.related('moderators').query()
      const payload = await request.validateUsing(createFlairValidator)
      if (await bouncer.with('FlairPolicy').denies('create', moderators)) {
        return response.forbidden({ message: 'You are not allowed to add flairs' })
      }
      await flair.merge(payload).save()
      return response.redirect().toPath(`/f/${forum.name}/flairs`)
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ message: 'Forum or flair not found', error: error })
      }
      if (error.messages) {
        return response.unprocessableEntity({ message: 'Validation error', error: error })
      }
      return response.internalServerError({ message: 'Internal server error', error: error })
    }
  }

  /**
   * @destroy
   * @summary Destory flair in the forum
   * @tag Flairs
   * @responseBody 200 - {message: 'Flair deleted', data: object}
   * @responseBody 500 - {message: 'Internal server error', error: error}
   */
  async destroy({ bouncer, params, response }: HttpContext) {
    try {
      const forum = await Forum.findByOrFail('id', params.forum_id)
      const flair = await Flair.findByOrFail('id', params.id)
      const moderators = await forum.related('moderators').query()
      if (await bouncer.with('FlairPolicy').denies('destory', moderators)) {
        return response.forbidden({ message: 'You are not allowed to delete this flair' })
      }
      await flair.delete()
      return response.ok({ message: 'Flair deleted', data: flair })
    } catch (error) {
      return response.internalServerError({ message: 'Internal server error', error: error })
    }
  }
}