import type { HttpContext } from '@adonisjs/core/http'
import Forum from '#models/forum'
import Profile from '#models/profile'
import { createForumValidator, pictureValidator } from '#validators/forum'
import Post from '#models/post'
import { sortPostValidator } from '#validators/post'
import type { ModelPaginatorContract } from '@adonisjs/lucid/types/model'
import { ManyToManyQueryBuilderContract, ModelRelations } from '@adonisjs/lucid/types/relations'
import { Exception } from '@adonisjs/core/exceptions'
import { FirebaseStorageService } from '#services/firebase_storage_service'
import Avatar from '#models/avatar'

export default class ForumController {
  // NOTES: rework with the API version
  /**
   * @index
   * @summary Show list of forums
   * @tag Forums
   * @responseBody 200 - <Forum[]>.with(defaultIcon)
   */
  async index({ request, inertia }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('per_page', 20)

    const forumQuery = await Forum.query().preload('defaultIcon').paginate(page, perPage)
    const { meta, data } = forumQuery.serialize()

    return inertia.render('forums/index', { forums: data, paginate: meta })
  }

  /**
   * @show
   * @summary Show forum with authorized posts also counts the comments for each post
   * @tag Forums
   * @responseBody 200 - <Forum>.with(posts, posts.comments)
   */
  async show({ bouncer, request, params, inertia, response, auth }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('per_page', 20)
    const { sort_by, order } = await request.validateUsing(sortPostValidator)

    const forum = await Forum.findByOrFail('name', params.name)
    const moderators = await forum.related('moderators').query().orderBy('pivot_created_at', 'asc')
    const creator = moderators[0]

    if (await bouncer.with('ForumPolicy').denies('show', moderators, creator, forum)) {
      throw new Exception('You cannot see details of this forum', {
        status: 403,
        code: 'E_FORBIDDEN_ACCESS',
      })
    }

    await forum.load('defaultIcon')
    const postQuery = await forum
      .related('posts')
      .query()
      .preload('forum')
      .preload('poster', (posterQuery) => posterQuery.preload('user'))
      .orderBy(sort_by || 'posterId', order || 'asc') // Adjust if database uses camelCase or snake_case
      .paginate(page, perPage)

    // NOTES: rework with the API version
    const authorizedPosts = (
      await Promise.all(
        postQuery.map(async (post) => {
          const canView = await bouncer.with('PostPolicy').allows('view', post)
          return canView ? post : null
        })
      )
    ).filter(Boolean) // Filter out any `null` or `undefined` values

    return inertia.render('forums/show', {
      forum: forum,
      paginate: postQuery.getMeta(),
      posts: authorizedPosts,
    })
  }

  /**
   * @create
   * @summary Render create page
   * @tag Forums
   */
  async create({ inertia, request, auth, response }: HttpContext) {
    return inertia.render('forum/create')
  }

  /**
   * @store
   * @summary Create a new forum
   * @tag Forums
   * @requestBody {"name":"Lorem", "description":"Lorem | null", "isPostingRestricted": true, "visibility": "public | private"}
   */
  async store({ inertia, request, auth, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(createForumValidator)
      const file = await request.validateUsing(pictureValidator)
      let avatar: Avatar | null = null
      let forum: Forum | null = null
      if (file?.imageUrl && auth.user) {
        const firebaseStorage = new FirebaseStorageService()
        const url = await firebaseStorage.uploadForumIcon(file.imageUrl, auth.user)
        avatar = await Avatar.create({ url: url })
      }
      if (avatar) {
        forum = await Forum.create({ ...payload, iconId: avatar.id })
      } else {
        forum = await Forum.create({ ...payload })
      }
      const userId = auth.user!.id
      const userProfile = await Profile.findByOrFail('userId', userId)
      await Forum.addModerator(forum, userProfile)
      return response.created({ message: 'Forum created', data: forum })
    } catch (error) {
      if (error.status === 422) {
        return response.unprocessableEntity({ message: 'Validation error', error: error.messages })
      }
      throw new Exception('Something went wrong', { cause: error, status: 500 })
    }
  }

  // TODO: make forum edit controller
  /**
   * @edit
   * @summary Forum's edit page
   * @tag Forums
   * @responseBody 200 - <Forum>.with(avatar).exclude(created_at, updated_at)
   */
  async edit({ params, inertia, bouncer, response, auth }: HttpContext) {
    //   const forum = await Forum.findByOrFail('id', params.id)
    //   try {
    //     if (await bouncer.with('ForumPolicy').denies('edit')) {
    //       return response.forbidden({ message: 'You cannot edit this forum' })
    //     }
    //     if (await bouncer.with('ForumPolicy').allows('edit')) {
    //       return response.json({ forum })
    //
    //       // return page di fe
    //       // return inertia.render('dummu', { forum })
    //     }
    //   } catch (error) {
    //     return response.badRequest({ message: 'Bad Request', error })
    //   }
  }

  /**
   * @update
   * @summary Update an existing forum
   * @tag Forums
   * @requestBody <Forum>.exclude(created_at, updated_at).append("url": "https://hahahihi.com")
   * @responseBody 200 - <Forum>
   */
  async update({ params, request, response, bouncer }: HttpContext) {
    try {
      const payload = await request.validateUsing(createForumValidator)
      const forum = await Forum.findByOrFail('name', params.name)
      await forum.load('moderators', async (mods) => await mods.orderBy('pivot_created_at', 'asc'))
      const moderators = forum.moderators
      if (await bouncer.with('ForumPolicy').denies('update', moderators)) {
        return response.forbidden({ message: 'You cannot edit this forum' })
      }
      await forum.merge(payload).save()
      return response.ok({ message: 'Forum updated', data: forum })
    } catch (error) {
      if (error.messages) {
        return response.unprocessableEntity({ message: 'Validation error', error: error })
      }
      return response.internalServerError({ message: 'Something went wrong', error: error })
    }
  }

  /**
   * @destroy
   * @summary Delete a forum
   * @tag Forums
   * @responseBody 200 - {"message": "Forum deleted"}
   */
  async destroy({ params, response, inertia, bouncer }: HttpContext) {
    try {
      const forum = await Forum.findByOrFail('name', params.name)
      const forumCreator = await forum
        .related('moderators')
        .query()
        .orderBy('pivot_created_at', 'asc')
        .firstOrFail()
      if (await bouncer.with('ForumPolicy').denies('destroy', forumCreator)) {
        return response.forbidden({ message: 'You cannot delete this forum' })
      }
      await forum.merge({ isDeleted: true }).save()
      return response.ok({ message: 'Forum deleted', data: forum })
    } catch (error) {
      return response.internalServerError({ message: 'Something went wrong', error: error })
    }
  }

  /**
   * @addModerator
   * @summary Add a moderator to a forum
   * @tag Forums
   * @requestBody {"targetUserId": 1}
   */
  async addModerator({ bouncer, params, request, response, inertia }: HttpContext) {
    if (request.method() === 'GET') {
      try {
        const forum = await Forum.findByOrFail('name', params.name)
        const forumModerators = forum.related('moderators')
        // add policy to show moderators (with ForumPolicy denies showModerators)
        // render inertia di fe
        return response.json({ forumModerators: forumModerators })
      } catch (error) {
        return response.internalServerError({ message: 'Something went wrong', error: error })
      }
    }
    if (request.method() === 'POST') {
      try {
        const currForum = await Forum.findByOrFail('name', params.name)
        await currForum.load(
          'moderators',
          async (mods) => await mods.orderBy('pivot_created_at', 'asc')
        )
        const moderators = currForum.moderators
        const { targetUserId } = request.body()
        const targetProfile = await Profile.findByOrFail('userId', targetUserId)
        await targetProfile.load('user')
        if (await bouncer.with('ForumPolicy').denies('addModerator', targetProfile, moderators)) {
          return response.forbidden({ message: 'You are not allowed to remove this profile' })
        }
        await Forum.addModerator(currForum, targetProfile)
        return response.ok({
          message: `Added ${targetProfile.user.username} as moderator in ${currForum.name}`,
        })
      } catch (error) {
        return response.internalServerError({ message: 'Something went wrong', error: error })
      }
    }
  }

  /**
   * @removeModerator
   * @summary Remove a moderator from a forum
   * @tag Forums
   * @requestBody {"targetUserId": 1}
   */
  async removeModerator({ params, request, response, bouncer, auth }: HttpContext) {
    try {
      const currForum = await Forum.findByOrFail('name', params.name)
      const forumCreator = await currForum
        .related('moderators')
        .query()
        .orderBy('pivot_created_at', 'asc')
        .firstOrFail()
      const { currForumId, targetUserId } = request.body()
      const targetProfile = await Profile.findByOrFail('userId', targetUserId)
      if (
        await bouncer.with('ForumPolicy').denies('removeModerator', targetProfile, forumCreator)
      ) {
        return response.forbidden({ message: 'You are not allowed to remove this moderator' })
      }
      await Forum.removeModerator(currForum, targetProfile)
      return response.ok({ message: 'User removed from moderator list', data: targetProfile })
    } catch (error) {
      if (error.messages) {
        return response.unprocessableEntity({ message: 'Validation Error', error: error })
      }
      return response.badRequest({ message: 'Bad Request', error: error })
    }
  }

  /**
   * @banProfile
   * @summary Ban a profile in forum
   * @tag Forums
   * @requestBody {"targetUserId": 1, "currForumId": 1}
   * @responseBody 200 - {message: 'User banned', data: <Profile>}
   * @responseBody 404 - {message: "", error: object}
   * @responseBody 422 - {message: "", error: object}
   */
  async banProfile({ bouncer, params, request, response }: HttpContext) {
    try {
      const { targetUserId, currForumId } = request.body()
      const currForum = await Forum.findByOrFail('id', currForumId)
      const forumModerators = await currForum.related('moderators').query()
      const targetProfile = await Profile.findByOrFail('userId', targetUserId)
      if (await bouncer.with('ForumPolicy').denies('banProfile', targetProfile, forumModerators)) {
        return response.forbidden({ message: 'You are not allowed to ban this user' })
      }
      await Forum.banProfile(currForum, targetProfile)
      return response.ok({ message: 'User banned from forum', data: targetProfile })
    } catch (error) {
      if (error.messages) {
        return response.unprocessableEntity({ message: 'Validation Error', error: error })
      }
      return response.badRequest({ message: 'Bad Request', error: error })
    }
  }

  /**
   * @unbanProfile
   * @summary Unban a profile in forum
   * @tag Forums
   * @requestBody {"targetUserId": 1, "currForumId": 1}
   * @responseBody 200 - {message: 'User unbanned', data: object}
   * @responseBody 404 - {message: "", error: object}
   * @responseBody 422 - {message: "", error: object}
   */
  async unbanProfile({ bouncer, params, request, response }: HttpContext) {
    try {
    } catch (error) {}
  }
}
