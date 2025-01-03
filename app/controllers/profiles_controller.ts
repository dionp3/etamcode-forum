import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Avatar from '#models/avatar'
import Comment from '#models/comment'
import Forum from '#models/forum'
import Post from '#models/post'
import Profile from '#models/profile'
import User from '#models/user'
import filter from '#services/filter_bad_words'
import { FirebaseStorageService } from '#services/firebase_storage_service'
import { sortPostValidator } from '#validators/post'
import { avatarValidator, updateProfileValidator } from '#validators/profile'
import { voteCommentValidator } from '#validators/vote'

export default class ProfilesController {
  /**
   * @index
   * @summary List all profiles for admin page
   * @tag Admin
   * @responseBody 200 - <User[]>.with(profile)
   * @responseBody 403 - {"error": "You are not allowed to see list of profiles"}
   */
  async index({ bouncer, inertia }: HttpContext) {
    // Query all user with their own profile
    const users = await User.query().preload('profile')

    if (await bouncer.with('ProfilePolicy').denies('view')) {
      throw new Exception('You are not allowed to see list of profiles', {
        status: 403,
        code: 'E_FORBIDDEN_ACCESS',
      })
    }
    if (await bouncer.with('ProfilePolicy').allows('view')) {
      return inertia.render('/admin/users', { users: users })
    }
  }

  /**
   * @show
   * @summary Show a specific user
   * @tag Users/Profiles
   * @description Retrieves details of a specific user if the user is authorized to view it
   * @paramPath username - The username of the user - @type(string) @required
   * @responseBody 200 - <Profile>.with(aggregate)
   */
  async show({ bouncer, params, request, inertia, auth }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('per_page', 20)
    const { sort_by, order } = await request.validateUsing(sortPostValidator)

    // Load the profile, its user, and paginated posts
    const profile = await Profile.query()
      .whereHas('user', (query) => {
        query.where('username', params.username)
      })
      .firstOrFail()
    if (!(await bouncer.with('ProfilePolicy').allows('show', profile)))
      throw new Exception('You are not allowed to see this profile', { status: 403 })

    const getProfile = async () => {
      await profile.load('user') // Preload the associated user
      await profile.load('avatar')
      await profile.load('followers')
      return profile
    }

    const followers = await db
      .from('profile_followers')
      .select('follower_id')
      .where('following_id', profile.userId)
      .catch(() => [])

    const isFollower = followers.some((follower) => follower.follower_id === auth.user?.id)

    // const followers = await profile.related('followers').query()

    // (followers)

    // const isFollower = followers.some((follower) => follower.userId === auth.user?.id)

    const postsQuery = await profile
      .related('posts')
      .query()
      .select('id', 'title', 'content', 'forumId', 'slug', 'imageUrl', 'createdAt', 'isRemoved')
      .where('isRemoved', false)
      .withCount('comments', (commentsQuery) => commentsQuery.where('isRemoved', false))
      .withCount('voters')
      .preload('forum', (forumQuery) =>
        forumQuery.select('name', 'iconId').preload('icon', (iconQuery) => iconQuery.select('url')),
      )
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
            title: post.title,
            content: post.content,
            imageUrl: post.imageUrl,
            slug: post.slug,
            forumName: post.forum.name,
            avatarUrl: post.forum.icon.url,
            createdAt: post.createdAt.toString(),
            totalScore: post.$extras.voters_count,
            totalComments: post.$extras.comments_count,
            flair: post.flair,
            userVoteScore,
          }
        }),
      ).then((posts) => posts.filter((post) => post !== null))

    return inertia.render('profile/show', {
      profile: await getProfile(),
      posts: inertia.defer(getPosts).merge(),
      isFollower,
      paginate: postsQuery.getMeta(),
    })
  }

  /**
   * @edit
   * @summary Renders edit page
   * @tag Users/Profiles
   * @responseBody 200 - <Profile>.exclude(created_at, updated_at)
   */
  async edit({ bouncer, response, inertia, auth }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized({ message: 'You must be logged in to edit a profile' })

    await user.load('profile', (profileQuery) => profileQuery.preload('avatar'))

    if (await bouncer.with('ProfilePolicy').denies('edit', user.profile)) {
      return response.redirect().toPath(`/u/${user.username}`)
    }
    return inertia.render('profile/edit', {
      user: user,
      profile: user.profile,
      avatarUrl: user.profile.avatar?.url,
    })
  }

  /**
   * @update
   * @summary Update user's profile
   * @tag Users/Profiles
   * @requestBody <Profile>.exclude(created_at, updated_at)
   * @responseBody 201 - {"message": "Profile updated", "profile": <User>.with(profile)}
   */
  async update({ bouncer, params, request, response, auth }: HttpContext) {
    try {
      const payload = await request.validateUsing(updateProfileValidator)
      const file = await request.validateUsing(avatarValidator)
      const displayName = payload.displayName ? filter.clean(payload.displayName) : null
      payload.bio = filter.clean(payload.bio)

      if (displayName?.includes('·')) {
        console.log('curse word detected')
        return response.redirect().toPath(`/u/${auth.user?.username}/edit`)
      }

      const user = await User.query().where('username', params.username).preload('profile').firstOrFail()
      console.log(payload)
      if (await bouncer.with('ProfilePolicy').denies('edit', user.profile)) {
        return response.forbidden({ message: 'You cannot edit this profile' })
      }

      let avatar: Avatar | null = null
      if (file?.imageUrl && auth.user) {
        const firebaseStorage = new FirebaseStorageService()
        const url = await firebaseStorage.uploadProfileAvatar(file.imageUrl, auth.user)

        avatar = await Avatar.create({ url: url })
      }

      if (avatar) {
        user.profile.merge({
          ...payload,
          displayName,
          avatarId: avatar.id,
        })
      } else {
        user.profile.merge(payload)
      }

      await user.profile.save()

      return response.redirect().toPath(`/u/${user.username}`)

      //   return response.ok({
      //     message: 'User profile updated',
      //     profile: user.profile,
      //   })
    } catch (error) {
      console.error('Profile update error:', error)

      return response.badRequest({
        message: 'Error updating profile',
        error: error instanceof Error ? error.message : error,
      })
    }
  }

  /**
   * @destroy
   * @summary Delete the profile and the user
   * @tag Users/Profiles
   * @responseBody 200 - {"message": "User deleted"}
   */
  async destroy({ bouncer, params, response }: HttpContext) {
    const user = await User.findByOrFail('username', params.username)
    const profile = await Profile.findByOrFail('userId', user.id)
    try {
      if (await bouncer.with('ProfilePolicy').denies('delete', profile)) {
        return response.forbidden({ message: 'You cannot delete this user' })
      }
      if (await bouncer.with('ProfilePolicy').allows('delete', profile)) {
        user.delete()
        return response.ok({ message: 'User deleted' })
      }
    } catch (error) {
      return response.badRequest({ message: 'Error deleting profile', error: error })
    }
  }

  /**
   * @upvotePost
   * @summary Upvote a post
   * @tag Posts
   * @requestBody {"userId": 1, "postSlug": "string"}
   * @responseBody 200 - {"message": "Post upvoted"}
   */
  async upvotePost({ response, request, bouncer, auth }: HttpContext) {
    const { postSlug } = request.body()
    const profile = await Profile.findByOrFail('userId', auth.user?.id)

    // const user = await User.query().where('id', userId).preload('profile').firstOrFail()
    const post = await Post.query().where('slug', postSlug).firstOrFail()
    if (await bouncer.with('PostPolicy').denies('vote', post)) {
      return response.forbidden({ message: "Can't upvote this post" })
    }
    await Profile.upvotePost(profile, post)
    return response.ok({ message: 'Post upvoted' })
  }

  /**
   * @downvotePost
   * @summary Downvote a post
   * @tag Posts
   * @requestBody {"userId": 1, "postSlug": "string"}
   * @responseBody 200 - {"message": "Post downvoted"}
   */
  async downvotePost({ response, request, bouncer, auth }: HttpContext) {
    const { postSlug } = request.body()
    const profile = await Profile.findByOrFail('userId', auth.user?.id)
    const post = await Post.query().where('slug', postSlug).firstOrFail()
    if (await bouncer.with('PostPolicy').denies('vote', post)) {
      return response.forbidden({ message: "Can't downvote this post" })
    }
    await Profile.downvotePost(profile, post)
    return response.ok({ message: 'Post downvoted' })
  }

  /**
   * @upvoteComment
   * @summary Upvote a comment
   * @tag Comments
   * @requestBody {"userId": 1, "commentSlug": "string"}
   * @responseBody 200 - {"message": "Comment upvoted"}
   */
  async upvoteComment({ response, request, bouncer, auth, params }: HttpContext) {
    const { commentSlug } = await request.validateUsing(voteCommentValidator)
    const profile = await Profile.findByOrFail('userId', auth.user?.id)
    const comment = await Comment.query().where('slug', commentSlug).preload('post').firstOrFail()
    const post = await Post.findByOrFail('slug', params.post_slug)
    if (await bouncer.with('CommentPolicy').denies('vote', post, comment)) {
      return response.forbidden({ message: "Can't upvote this comment" })
    }
    await Profile.upvoteComment(profile, post, comment)
    return response.ok({ message: 'Comment upvoted' })
  }

  /**
   * @downvoteComment
   * @summary Downvote a comment
   * @tag Comments
   * @requestBody {"userId": 1, "commentSlug": "string"}
   * @responseBody 200 - {"message": "Comment downvoted"}
   */
  async downvoteComment({ response, request, bouncer, auth, params }: HttpContext) {
    const { commentSlug } = await request.validateUsing(voteCommentValidator)
    const profile = await Profile.findByOrFail('userId', auth.user?.id)
    const comment = await Comment.query().where('slug', commentSlug).preload('post').firstOrFail()
    const post = await Post.findByOrFail('slug', params.post_slug)
    if (await bouncer.with('CommentPolicy').denies('vote', post, comment)) {
      return response.forbidden({ message: "Can't downvote this comment" })
    }
    await Profile.downvoteComment(profile, post, comment)
    return response.ok({ message: 'Comment downvoted' })
  }

  /**
   * @followForum
   * @summary Follow a forum
   * @tag Forums
   * @requestBody {"currUserId": 2, "forumTargetId": 2}
   * @responseBody 200 - {message: 'Forum followed'}
   * @responseBody 403 - {message: 'You already followed this forum'}
   * @responseBody 404 - {message: 'Requested data is not found', error: object}
   * @responseBody 422 - {message: 'Validation error', error: object}
   * @responseBody 500 - {message: 'Internal server error', error: object}
   */
  async followForum({ bouncer, request, response, auth }: HttpContext) {
    try {
      const { forumTargetId } = request.body()
      const userProfile = await Profile.findByOrFail('userId', auth.user?.id)
      const targetForum = await Forum.findByOrFail('id', forumTargetId)
      const forumFollowers = await targetForum.related('followers').query()
      if (await bouncer.with('ProfilePolicy').denies('followForum', forumFollowers)) {
        return response.forbidden({ message: 'You already followed this forum' })
      }
      await Profile.followForum(userProfile, targetForum)
      return response.ok({ message: 'Forum followed', data: targetForum })
    } catch (error) {
      if (error.messages) {
        return response.unprocessableEntity({ message: 'Validation error', error: error })
      }
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ message: 'Requested data is not found', error: error })
      }
      return response.badRequest({ message: 'Bad request', error: error })
    }
  }

  /**
   * @unfollowForum
   * @summary Unfollow a forum
   * @tag Forums
   * @requestBody {"currUserId": 2, "forumTargetId": 2}
   * @responseBody 200 - {message: 'Forum followed'}
   * @responseBody 404 - {message: 'Requested data is not found', error: object}
   * @responseBody 422 - {message: 'Validation error', error: object}
   * @responseBody 500 - {message: 'Internal server error', error: object}
   */
  async unfollowForum({ bouncer, request, response, auth }: HttpContext) {
    try {
      const { forumTargetId } = request.body()
      const userProfile = await Profile.findByOrFail('userId', auth.user?.id)
      const targetForum = await Forum.findByOrFail('id', forumTargetId)
      const forumFollowers = await targetForum.related('followers').query()
      if (await bouncer.with('ProfilePolicy').denies('unfollowForum', forumFollowers)) {
        return response.forbidden({ message: 'You already unfollow this forum' })
      }
      await Profile.unfollowForum(userProfile, targetForum)
      return response.ok({ message: 'Forum unfollowed', data: targetForum })
    } catch (error) {
      if (error.messages) {
        return response.unprocessableEntity({ message: 'Validation error', error: error })
      }
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ message: 'Requested data is not found', error: error })
      }
      return response.badRequest({ message: 'Bad request', error: error })
    }
  }

  /**
   * @blockForum
   * @summary Block a forum
   * @tag Forums
   * @requestBody {"currUserId": 2, "forumTargetId": 2}
   * @responseBody 200 - {message: 'Forum blocked', data: <Forum>}
   * @responseBody 404 - {message: 'Requested data not found', error: object}
   * @responseBody 422 - {message: 'Validation error', error: object}
   * @responseBody 500 - {message: 'Bad request', error: error}
   */
  async blockForum({ bouncer, request, response }: HttpContext) {
    try {
      const { currUserId, forumTargetId } = request.body()
      const userProfile = await Profile.findByOrFail('userId', currUserId)
      const targetForum = await Forum.findByOrFail('id', forumTargetId)
      const forumBlockers = await targetForum.related('blockedByProfile').query()

      if (await bouncer.with('ProfilePolicy').denies('blockForum', forumBlockers)) {
        return response.forbidden({ message: 'You already blocked this forum' })
      }
      await Profile.blockForum(userProfile, targetForum)
      return response.ok({ message: 'Forum blocked', data: targetForum })
    } catch (error) {
      if (error.messages) {
        return response.unprocessableEntity({ message: 'Validation error', error: error })
      }
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ message: 'Requested data is not found', error: error })
      }
      return response.badRequest({ message: 'Bad request', error: error })
    }
  }

  /**
   * @unblockForum
   * @summary Block a forum
   * @tag Forums
   * @requestBody {"currUserId": 2, "forumTargetId": 2}
   * @responseBody 200 - {message: 'Forum unblocked', data: <Forum>}
   * @responseBody 404 - {message: 'Requested data not found', error: object}
   * @responseBody 422 - {message: 'Validation error', error: object}
   * @responseBody 500 - {message: 'Bad request', error: error}
   */
  async unblockForum({ bouncer, request, response }: HttpContext) {
    try {
      const { currUserId, forumTargetId } = request.body()
      const userProfile = await Profile.findByOrFail('userId', currUserId)
      const targetForum = await Forum.findByOrFail('id', forumTargetId)
      const forumBlockers = await targetForum.related('blockedByProfile').query()

      if (await bouncer.with('ProfilePolicy').denies('unblockForum', forumBlockers)) {
        return response.forbidden({ message: 'You already blocked this forum' })
      }

      await Profile.unblockForum(userProfile, targetForum)
      return response.ok({ message: 'Forum blocked', data: targetForum })
    } catch (error) {
      if (error.messages) {
        return response.unprocessableEntity({ message: 'Validation error', error: error })
      }
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ message: 'Requested data is not found', error: error })
      }
      return response.badRequest({ message: 'Bad request', error: error })
    }
  }

  /**
   * @followProfile
   * @summary Follow a user a.k.a profile
   * @tag Users/Profiles
   * @requestBody {"currentUserId": 1, "targetUserId": 1}
   * @responseBody 200 - {"message": "Sucessfully following this profile"}
   */
  async followProfile({ response, request, params, bouncer, auth }: HttpContext) {
    try {
      if (request.method() === 'GET') {
        const profile = await Profile.findByOrFail('userId', params.id)
        const followers = profile.related('followers')
        return response.json({ followers })
      }
      if (request.method() === 'POST') {
        const { targetUserId } = request.body()
        const targetProfile = await Profile.findByOrFail('userId', targetUserId)
        const currentProfile = await Profile.findByOrFail('userId', auth.user?.id)
        const followings = await currentProfile.related('followings').query()

        if (await bouncer.with('ProfilePolicy').denies('followUser', targetProfile, followings)) {
          return response.forbidden({ message: 'You cannot follow this profile' })
        }
        await Profile.followProfile(currentProfile, targetProfile)
        return response.ok({ message: 'Sucessfully following this profile' })
      }
    } catch (error) {
      return response.badRequest({ message: 'Bad Request', error })
    }
  }

  /**
   * @unfollowProfile
   * @summary Unfollow a user a.k.a profile
   * @tag Users/Profiles
   * @requestBody {"currentUserId": 1, "targetUserId": 1}
   * @responseBody 200 - {"message": "User unfollowed"}
   */
  async unfollowProfile({ response, request, bouncer, auth }: HttpContext) {
    try {
      if (request.method() === 'POST') {
        const { targetUserId } = request.body()
        const targetProfile = await Profile.findByOrFail('userId', targetUserId)
        const currentProfile = await Profile.findByOrFail('userId', auth.user?.id)
        const followings = await currentProfile.related('followings').query()

        if (await bouncer.with('ProfilePolicy').denies('unfollow', targetProfile, followings)) {
          return response.forbidden({ message: 'You cannot unfollow this profile' })
        }
        await Profile.unfollowProfile(currentProfile, targetProfile)
        return response.ok({ message: 'User unfollowed' })
      }
    } catch (error) {
      return response.badRequest({ message: 'Bad Request', error })
    }
  }

  /**
   * @blockProfile
   * @summary Block a user a.k.a profile
   * @tag Users/Profiles
   * @requestBody {"currentUserId": 1, "targetUserId": 1}
   * @responseBody 200 - {"message": "User blocked"}
   */
  async blockProfile({ response, request, params, bouncer }: HttpContext) {
    try {
      if (request.method() === 'GET') {
        const profile = await Profile.findByOrFail('userId', params.id)
        const blockedProfiles = await profile.related('blockedProfiles').query()
        return response.json({ blockedProfiles })
      }
      if (request.method() === 'POST') {
        const { currentUserId, targetUserId } = request.body()
        const targetProfile = await Profile.findByOrFail('userId', targetUserId)
        await targetProfile.load('user')
        const currentProfile = await Profile.findByOrFail('userId', currentUserId)
        const blockedProfiles = await currentProfile.related('blockedProfiles').query()
        if (await bouncer.with('ProfilePolicy').denies('block', targetProfile, blockedProfiles)) {
          return response.forbidden({ message: 'You cannot block this profile' })
        }
        await Profile.blockProfile(currentProfile, targetProfile)
        return response.ok({ message: 'User blocked' })
      }
    } catch (error) {
      return response.badRequest({ message: 'Bad Request', error })
    }
  }

  /**
   * @unblockProfile
   * @summary Unblock a user a.k.a profile
   * @tag Users/Profiles
   * @requestBody {"currentUserId": 1, "targetUserId": 1}
   * @responseBody 200 - {"message": "User unblocked"}
   */

  async unblockProfile({ response, request, bouncer }: HttpContext) {
    try {
      if (request.method() === 'POST') {
        const { currentUserId, targetUserId } = request.body()
        const targetProfile = await Profile.findByOrFail('userId', targetUserId)
        const currentProfile = await Profile.findByOrFail('userId', currentUserId)
        const blockedProfiles = await currentProfile.related('blockedProfiles').query()

        if (await bouncer.with('ProfilePolicy').denies('unblock', targetProfile, blockedProfiles)) {
          return response.forbidden({ message: 'You cannot unblock this profile' })
        }
        await Profile.unblockProfile(currentProfile, targetProfile)
        return response.ok({ message: 'Sucessfully unblock this profile' })
      }
    } catch (error) {
      return response.badRequest({ message: 'Bad Request', error })
    }
  }

  async hidePost({ bouncer, response, params, auth }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized({ message: 'You must be logged in to hide a post' })
    }
    const forum = await Forum.query()
      .where('name', params.name)
      .preload('moderators', (mods) => mods.orderBy('pivot_created_at', 'asc'))
      .preload('posts')
      .firstOrFail()
    const moderators = forum.moderators

    if (await bouncer.with('ForumPolicy').denies('show', moderators, moderators[0], forum)) {
      return response.forbidden({
        message: 'You cannot hide this post because the forum is restricted',
      })
    }

    const post = await Post.query().where('slug', params.post_slug).firstOrFail()
    if (await bouncer.with('PostPolicy').denies('show', post)) {
      return response.forbidden({ message: 'You are not allowed to hide this post' })
    }

    const profile = await Profile.query().where('userId', user.id).firstOrFail()
    const hiddenPosts = await profile.related('postHide').query()

    if (await bouncer.with('ProfilePolicy').denies('hidePost', post, hiddenPosts)) {
      return response.forbidden({ message: 'You are not allowed to hide this post' })
    }

    await Profile.hidePost(profile, post)

    return response.ok({ message: 'Post hidden', user: auth.user, post, forum })
  }

  async unhidePost({ bouncer, response, params, auth }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized({ message: 'You must be logged in to unhide a post' })
    }
    const forum = await Forum.query()
      .where('name', params.name)
      .preload('moderators', (mods) => mods.orderBy('pivot_created_at', 'asc'))
      .preload('posts')
      .firstOrFail()
    const moderators = forum.moderators

    if (await bouncer.with('ForumPolicy').denies('show', moderators, moderators[0], forum)) {
      return response.forbidden({
        message: 'You cannot umhide this post because the forum is restricted',
      })
    }

    const post = await Post.query().where('slug', params.post_slug).firstOrFail()
    if (await bouncer.with('PostPolicy').denies('show', post)) {
      return response.forbidden({ message: 'You are not allowed to umhide this post' })
    }

    const profile = await Profile.query().where('userId', user.id).firstOrFail()
    const hiddenPosts = await profile.related('postHide').query()

    if (await bouncer.with('ProfilePolicy').denies('unhidePost', post, hiddenPosts)) {
      return response.forbidden({ message: 'You are not allowed to umhide this post' })
    }

    await Profile.unhidePost(profile, post)

    // TODO : Redirect ke halaman (tapi aku gatau redirect kemana)
    return response.ok({ message: 'Post unhidden', user: auth.user, post, forum })
  }
}
