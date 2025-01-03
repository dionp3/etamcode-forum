import Avatar from '#models/avatar'
import Post from '#models/post'
import Profile from '#models/profile'
import User from '#models/user'
import Comment from '#models/comment'
import { FirebaseStorageService } from '#services/firebase_storage_service'
import { sortPostValidator } from '#validators/post'
import { avatarValidator, updateProfileValidator } from '#validators/profile'
import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import { voteCommentValidator } from '#validators/vote'
import Forum from '#models/forum'

export default class ProfilesController {
  /**
   * @index
   * @summary List all profiles for admin page
   * @tag Admin
   * @responseBody 200 - <User[]>.with(profile)
   * @responseBody 403 - {"error": "You are not allowed to see list of profiles"}
   */
  async index({ bouncer, inertia, response }: HttpContext) {
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
  async show({ bouncer, params, request, inertia, response, auth }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('per_page', 20)
    const { sort_by, order } = await request.validateUsing(sortPostValidator)

    // Load the profile, its user, and paginated posts
    const profile = await Profile.query()
      .whereHas('user', (query) => {
        query.where('username', params.username)
      })
      .preload('user') // Preload the associated user
      .preload('avatar')
      .firstOrFail()

    const postsQuery = await profile
      .related('posts')
      .query()
      .preload('forum')
      .orderBy(sort_by || 'poster_id', order || 'asc')
      .paginate(page, perPage)

    const authorizedPosts = (
      await Promise.all(
        postsQuery.map(async (post) => {
          const canView = await bouncer.with('PostPolicy').allows('view', post)
          return canView ? post : null
        })
      )
    ).filter(Boolean) // Filter out any `null` or `undefined` values

    if (await bouncer.with('ProfilePolicy').denies('show', profile)) {
      throw new Exception('You are not allowed to see list of profiles', {
        status: 403,
        code: 'E_FORBIDDEN_ACCESS',
      })
    }

    if (await bouncer.with('ProfilePolicy').allows('show', profile)) {
      return inertia.render('profile/show', {
        profile,
        paginate: postsQuery.getMeta(),
        posts: authorizedPosts,
      })
    }
  }

  /**
   * @edit
   * @summary Renders edit page
   * @tag Users/Profiles
   * @responseBody 200 - <Profile>.exclude(created_at, updated_at)
   */
  async edit({ bouncer, response, params, inertia }: HttpContext) {
    const user = await User.findByOrFail('username', params.username)
    await user.load('profile')
    try {
      if (await bouncer.with('ProfilePolicy').denies('edit', user.profile)) {
        return response.forbidden({ message: 'You cannot edit this profile' })
      }
      return inertia.render('profile/edit', { user: user, profile: user.profile })
    } catch (error) {
      return response.badRequest({ message: 'Bad request', error: error })
    }
  }

  /**
   * @update
   * @summary Update user's profile
   * @tag Users/Profiles
   * @requestBody {"displayName":"Lorem", "bio":"Lorem"}
   * @responseBody 201 - {"message": "Profile updated", "profile": <User>.with(profile)}
   */
  async update({ bouncer, params, request, response, auth }: HttpContext) {
    try {
      const payload = await request.validateUsing(updateProfileValidator)
      const file = await request.validateUsing(avatarValidator)

      const user = await User.query()
        .where('username', params.username)
        .preload('profile')
        .firstOrFail()

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
          avatarId: avatar.id,
        })
      } else {
        user.profile.merge(payload)
      }

      await user.profile.save()

      return response.ok({
        message: 'User profile updated',
        profile: user.profile,
      })
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
  async upvotePost({ response, request, bouncer }: HttpContext) {
    const { userId, postSlug } = request.body()
    const user = await User.query().where('id', userId).preload('profile').firstOrFail()
    const post = await Post.query().where('slug', postSlug).firstOrFail()
    if (await bouncer.with('PostPolicy').denies('vote', post)) {
      return response.forbidden({ message: "Can't upvote this post" })
    }
    await Profile.upvotePost(user.profile, post)
    return response.ok({ message: 'Post upvoted' })
  }

  /**
   * @downvotePost
   * @summary Downvote a post
   * @tag Posts
   * @requestBody {"userId": 1, "postSlug": "string"}
   * @responseBody 200 - {"message": "Post downvoted"}
   */
  async downvotePost({ response, request, bouncer }: HttpContext) {
    const { userId, postSlug } = request.body()
    const user = await User.query().where('id', userId).preload('profile').firstOrFail()
    const post = await Post.query().where('slug', postSlug).firstOrFail()
    if (await bouncer.with('PostPolicy').denies('vote', post)) {
      return response.forbidden({ message: "Can't downvote this post" })
    }
    await Profile.downvotePost(user.profile, post)
    return response.ok({ message: 'Post downvoted' })
  }

  /**
   * @upvoteComment
   * @summary Upvote a comment
   * @tag Comments
   * @requestBody {"userId": 1, "commentSlug": "string"}
   * @responseBody 200 - {"message": "Comment upvoted"}
   */
  async upvoteComment({ response, request, bouncer }: HttpContext) {
    const { userId, commentSlug } = await request.validateUsing(voteCommentValidator)
    const user = await User.query().where('id', userId).preload('profile').firstOrFail()
    const comment = await Comment.query().where('slug', commentSlug).preload('post').firstOrFail()
    if (await bouncer.with('CommentPolicy').denies('vote', comment.post, comment)) {
      return response.forbidden({ message: "Can't upvote this comment" })
    }
    await Profile.upvoteComment(user.profile, comment.post, comment)
    return response.ok({ message: 'Comment upvoted' })
  }

  /**
   * @downvoteComment
   * @summary Downvote a comment
   * @tag Comments
   * @requestBody {"userId": 1, "commentSlug": "string"}
   * @responseBody 200 - {"message": "Comment downvoted"}
   */
  async downvoteComment({ response, request, bouncer }: HttpContext) {
    const { userId, commentSlug } = await request.validateUsing(voteCommentValidator)
    const user = await User.query().where('id', userId).preload('profile').firstOrFail()
    const comment = await Comment.query().where('slug', commentSlug).preload('post').firstOrFail()
    if (await bouncer.with('CommentPolicy').denies('vote', comment.post, comment)) {
      return response.forbidden({ message: "Can't downvote this comment" })
    }
    await Profile.downvoteComment(user.profile, comment.post, comment)
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
  async followForum({ bouncer, params, request, response }: HttpContext) {
    try {
      const { currUserId, forumTargetId } = request.body()
      const userProfile = await Profile.findByOrFail('userId', currUserId)
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
  async unfollowForum({ bouncer, params, request, response }: HttpContext) {
    try {
      const { currUserId, forumTargetId } = request.body()
      const userProfile = await Profile.findByOrFail('userId', currUserId)
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
  async blockForum({ bouncer, params, request, response }: HttpContext) {
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
  async unblockForum({ bouncer, params, request, response }: HttpContext) {
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
  async followProfile({ response, request, params, bouncer }: HttpContext) {
    try {
      if (request.method() === 'GET') {
        const profile = await Profile.findByOrFail('userId', params.id)
        const followers = profile.related('followers')
        return response.json({ followers })
      }
      if (request.method() === 'POST') {
        console.log(request.body())
        const { currentUserId, targetUserId } = request.body()
        const targetProfile = await Profile.findByOrFail('userId', targetUserId)
        const currentProfile = await Profile.findByOrFail('userId', currentUserId)
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
  async unfollowProfile({ response, request, bouncer }: HttpContext) {
    try {
      if (request.method() === 'POST') {
        const { currentUserId, targetUserId } = request.body()
        const targetProfile = await Profile.findByOrFail('userId', targetUserId)
        const currentProfile = await Profile.findByOrFail('userId', currentUserId)
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
}
