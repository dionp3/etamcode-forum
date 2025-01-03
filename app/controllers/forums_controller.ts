import type { HttpContext } from '@adonisjs/core/http'
import Forum from '#models/forum'
import Profile from '#models/profile'
import { createForumValidator, pictureValidator } from '#validators/forum'
import { sortPostValidator } from '#validators/post'
import { Exception } from '@adonisjs/core/exceptions'
import { FirebaseStorageService } from '#services/firebase_storage_service'
import Avatar from '#models/avatar'
import filter from '#services/filter_bad_words'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
type Visibility = 'public' | 'private' | 'restricted'

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

    const forumQuery = await Forum.query().preload('icon').paginate(page, perPage)
    const { meta, data } = forumQuery.serialize()

    return inertia.render('forums/index', { forums: data, paginate: meta })
  }

  /**
   * @show
   * @summary Show forum with authorized posts also counts the comments for each post
   * @tag Forums
   * @responseBody 200 - <Forum>.with(posts, posts.comments)
   */
  async show({ bouncer, request, params, inertia, auth }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('per_page', 20)
    const { sort_by, order } = await request.validateUsing(sortPostValidator)

    const forum = await Forum.findByOrFail('name', params.name)
    const moderators = await forum.related('moderators').query().orderBy('pivot_created_at', 'asc')
    const creator = moderators[0]

    const followers = await forum.related('followers').query()

    const isFollowed = followers.some((follower) => follower.userId === auth.user?.id)
    const userCanEdit = moderators.some((moderator) => moderator.userId === auth.user?.id)

    const flairs = await forum.related('flairs').query()

    if (await bouncer.with('ForumPolicy').denies('show', moderators, creator, forum)) {
      throw new Exception('You cannot see details of this forum', { status: 403 })
    }
    const getForum = async () => {
      await forum.load('icon', async (iconQuery) => await iconQuery.select('url'))
      return forum
    }

    const postsQuery = await forum
      .related('posts')
      .query()
      .select('id', 'posterId', 'title', 'content', 'forumId', 'slug', 'imageUrl', 'createdAt', 'isRemoved')
      .where('isRemoved', false)
      .preload('poster', (posterQuery) =>
        posterQuery
          .select('displayName', 'userId', 'avatarId')
          .preload('user', (userQuery) => userQuery.select('username'))
          .preload('avatar', (avatarQuery) => avatarQuery.select('url')),
      )
      .withCount('comments', (commentsQuery) => commentsQuery.where('isRemoved', false))
      .withCount('voters')
      .orderBy(sort_by || 'createdAt', order || 'desc')
      .paginate(page, perPage)

    const getPosts = async () =>
      await Promise.all(
        postsQuery.map(async (post) => {
          if (!(await bouncer.with('PostPolicy').allows('view', post))) return null
          const userVoteScore = auth.user
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
            avatarUrl: post.poster.avatar.url,
            createdAt: post.createdAt.toString(),
            totalComments: post.$extras.comments_count,
            totalScore: post.$extras.voters_count,
            userVoteScore: userVoteScore,
          }
        }),
      ).then((posts) => posts.filter((post) => post !== null))

    return inertia.render('forums/show', {
      forum: await getForum(),
      posts: inertia.defer(getPosts).merge(),
      paginate: postsQuery.getMeta(),
      flairs: flairs,
      followers: followers,
      isFollowed: isFollowed,
      userCanEdit,
    })
  }

  /**
   * @create
   * @summary Render create page
   * @tag Forums
   */
  async create({ inertia }: HttpContext) {
    return inertia.render('forums/create')
  }

  /**
   * @store
   * @summary Create a new forum
   * @tag Forums
   * @requestBody {"name":"Lorem", "description":"Lorem | null", "isPostingRestricted": true, "visibility": "public | private"}
   */
  async store({ request, auth, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(createForumValidator)
      payload.name = filter.clean(payload.name)
      payload.description = filter.clean(payload.description)
      //   if (payload.description) {
      //     payload.description = filter.clean(payload.description)
      //   }

      console.log(payload)

      if (payload.name.includes('·') || payload?.description?.includes('·')) {
        return response.redirect().toPath('/f/create')
      }
      const file = await request.validateUsing(pictureValidator)
      let avatar: Avatar | null = null
      let forum: Forum | null = null
      if (file?.imageUrl && auth.user) {
        const firebaseStorage = new FirebaseStorageService()
        const url = await firebaseStorage.uploadForumIcon(file.imageUrl, auth.user)
        avatar = await Avatar.create({ url: url })
      }
      const visibility: Visibility = (payload.visibility as Visibility) || 'public'
      if (avatar) {
        forum = await Forum.create({
          ...payload,
          visibility: visibility,
          iconId: avatar.id,
        })
      } else {
        forum = await Forum.create({ ...payload, visibility: visibility })
      }
      const userId = auth.user?.id
      const userProfile = await Profile.findByOrFail('userId', userId)
      await Forum.addModerator(forum, userProfile)
      return response.redirect().toPath(`f/${payload.name}`)
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
  async edit({ params, inertia, bouncer, response }: HttpContext) {
    try {
      // Find forum by its 'name' parameter or fail with 404
      const forum = await Forum.findByOrFail('name', params.name)

      // Load moderators and order them by 'pivot_created_at'
      await forum.load('moderators', async (mods) => {
        await mods.orderBy('pivot_created_at', 'asc')
      })

      // Check if the current user is allowed to update the forum
      if (await bouncer.with('ForumPolicy').denies('update', forum.moderators)) {
        return response.forbidden({ message: 'You cannot edit this forum' })
      }

      // Render the edit page if authorization passes
      return inertia.render('forums/edit', { forum })
    } catch (error) {
      // Handle errors: log and return a generic bad request message
      return response.badRequest({ message: 'Unable to load the forum', error })
    }
  }

  /**
   * @update
   * @summary Update an existing forum
   * @tag Forums
   * @requestBody <Forum>.exclude(created_at, updated_at).append("url": "https://hahahihi.com")
   * @responseBody 200 - <Forum>
   */
  async update({ params, request, response, bouncer, auth }: HttpContext) {
    try {
      const payload = await request.validateUsing(createForumValidator)
      payload.name = filter.clean(payload.name)
      payload.description = filter.clean(payload.description)
      const forum = await Forum.findByOrFail('name', params.name)
      await forum.load('moderators', async (mods) => await mods.orderBy('pivot_created_at', 'asc'))
      const moderators = forum.moderators
      if (await bouncer.with('ForumPolicy').denies('update', moderators)) {
        return response.forbidden({ message: 'You cannot edit this forum' })
      }
      const file = await request.validateUsing(pictureValidator)
      let avatar: Avatar | null = null
      if (file?.imageUrl && auth.user) {
        const firebaseStorage = new FirebaseStorageService()
        const url = await firebaseStorage.uploadForumIcon(file.imageUrl, auth.user)
        if (forum.iconId) {
          await Avatar.findByOrFail('id', forum.iconId)
        }
        avatar = await Avatar.create({ url: url })
      }

      const visibility = (payload.visibility as Visibility) || 'public'

      if (avatar) {
        await forum.merge({ ...payload, visibility: visibility, iconId: avatar.id }).save()
      } else {
        await forum.merge({ ...payload, visibility }).save()
      }
      //   await currAvatar?.delete()
      //   return response.ok({ message: 'Forum updated', data: forum })
      return response.redirect().toPath(`/f/${params.name}`)
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
  async destroy({ params, response, bouncer }: HttpContext) {
    try {
      const forum = await Forum.findByOrFail('name', params.name)
      const forumCreator = await forum.related('moderators').query().orderBy('pivot_created_at', 'asc').firstOrFail()
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
  async addModerator({ bouncer, params, request, response, inertia, auth }: HttpContext) {
    if (request.method() === 'GET') {
      try {
        const forum = await Forum.findByOrFail('name', params.name)
        const forumModerators = await forum.related('moderators').query()
        for (const moderators of forumModerators) {
          await moderators.load('user')
        }
        // add policy to show moderators (with ForumPolicy denies showModerators)
        // render inertia di fe
        const forumCreator = await forum.related('moderators').query().orderBy('pivot_created_at', 'asc').firstOrFail()
        if (forumCreator.userId !== auth.user?.id) {
          return response.redirect().toPath(`/f/${forum.name}`)
        }
        return inertia.render('moderator/index', {
          forum,
          moderators: forumModerators,
          userId: auth.user?.id,
        })
      } catch (error) {
        error
        return response.internalServerError({ message: 'Something went wrong', error: error })
      }
    }
    if (request.method() === 'POST') {
      try {
        const currForum = await Forum.findByOrFail('name', params.name)
        await currForum.load('moderators', async (mods) => await mods.orderBy('pivot_created_at', 'asc'))
        const moderators = currForum.moderators
        const { targetUsername } = request.body()
        const user = await User.query().where('username', targetUsername).preload('profile').firstOrFail()
        const targetProfile = user.profile
        if (await bouncer.with('ForumPolicy').denies('addModerator', targetProfile, moderators)) {
          return response.forbidden({ message: 'You are not allowed to remove this profile' })
        }
        await Forum.addModerator(currForum, targetProfile)
        // return response.ok({
        //   message: `Added ${targetProfile.user.username} as moderator in ${currForum.name}`,
        // })
        return response.redirect().toPath(`/f/${currForum.name}/moderators`)
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
  async removeModerator({ params, request, response, bouncer }: HttpContext) {
    try {
      const currForum = await Forum.findByOrFail('name', params.name)
      const forumCreator = await currForum
        .related('moderators')
        .query()
        .orderBy('pivot_created_at', 'asc')
        .firstOrFail()
      const { targetUserId } = request.body()
      const targetProfile = await Profile.findByOrFail('userId', targetUserId)
      if (await bouncer.with('ForumPolicy').denies('removeModerator', targetProfile, forumCreator)) {
        return response.forbidden({ message: 'You are not allowed to remove this moderator' })
      }
      await Forum.removeModerator(currForum, targetProfile)
      //   return response.ok({ message: 'User removed from moderator list', data: targetProfile })
      return response.redirect().toPath(`/f/${Forum.name}`)
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
  async banProfile({ bouncer, request, response }: HttpContext) {
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
  //async unbanProfile({ bouncer, params, request, response }: HttpContext) {
  //  try {
  //  } catch (error) {}
  //}
}
