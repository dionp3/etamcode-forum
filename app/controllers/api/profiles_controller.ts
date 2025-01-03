import Forum from '#models/forum'
import Post from '#models/post'
import Profile from '#models/profile'
import User from '#models/user'
import Comment from '#models/comment'
import { updateProfileValidator } from '#validators/profile'
import type { HttpContext } from '@adonisjs/core/http'
import { voteCommentValidator, votePostValidator } from '#validators/vote'

export default class ProfilesController {
  /**
   * Display a list of resource
   */
  async index({ bouncer, inertia, response }: HttpContext) {
    // Query all user with their own profile
    const users = await User.all()
    // users.map((user) => user.load('profile'))
    await Promise.all(users.map((user) => user.load('profile')))
    // const profiles = users.map((user) => user.profile)

    try {
      if (await bouncer.with('ProfilePolicy').denies('view')) {
        return response.forbidden({ message: 'You are not allowed to see list of profiles' })
      }
      if (await bouncer.with('ProfilePolicy').allows('view')) {
        return inertia.render('/admin/users', { users: users })
      }
    } catch (error) {
      return response.badRequest({ message: 'Bad request', error: error })
    }
  }

  /**
   * Show individual record
   */
  async show({ bouncer, params, inertia, response, auth }: HttpContext) {
    const user = await User.findByOrFail('username', params.username)
    const profile = await Profile.findByOrFail('userId', user.id)
    await profile.load('user')

    try {
      if (await bouncer.with('ProfilePolicy').denies('show', profile)) {
        return response.forbidden({ message: 'You are not allowed to see this profile' })
      }
      if (await bouncer.with('ProfilePolicy').allows('show', profile)) {
        return response.json({ profile: profile })
      }
    } catch (error) {
      return response.badRequest({ message: 'Bad request', error: error })
    }
  }

  /**
   * Edit individual record
   */
  async edit({ bouncer, response, params, inertia }: HttpContext) {
    const user = await User.findByOrFail('username', params.username)
    await user.load('profile')
    try {
      if (await bouncer.with('ProfilePolicy').denies('edit', user.profile)) {
        return response.forbidden({ message: 'You cannot edit this profile' })
      }
      if (await bouncer.with('ProfilePolicy').allows('edit', user.profile)) {
        return response.json({ user: user })

        // NOTE: buat yg fe ganti aja page dummy nya
        // return inertia.render('dummy', { userProfile: user.profile })
      }
    } catch (error) {
      return response.badRequest({ message: 'Bad request', error: error })
    }
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ bouncer, params, request, response, auth }: HttpContext) {
    // const data = request.only(['display_name', 'bio'])
    const data = await request.validateUsing(updateProfileValidator)
    console.log(data)
    const user = await User.findByOrFail('username', params.username)
    const profile = await Profile.findByOrFail('userId', user.id)
    // await user.load('profile')
    try {
      if (await bouncer.with('ProfilePolicy').denies('edit', profile)) {
        return response.forbidden({ message: 'You cannot edit this profile' })
      }
      await profile.merge(data).save()
      return response.ok({ message: 'User profile updated' })
    } catch (error) {
      if (error.messages) {
        return response.unprocessableEntity({ message: 'Validation error', error: error })
      }
      return response.badRequest({ message: 'Error updating profile', error: error })
    }
  }

  /**
   * Delete record
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

  async upvotePost({ response, request, bouncer }: HttpContext) {
    const { userId, postSlug } = await request.validateUsing(votePostValidator)
    const user = await User.query().where('id', userId).preload('profile').firstOrFail()
    const post = await Post.query().where('slug', postSlug).firstOrFail()
    if (await bouncer.with('PostPolicy').denies('vote', post)) {
      return response.forbidden({ message: "Can't upvote this post" })
    }
    await Profile.upvotePost(user.profile, post)
    return response.ok({ message: 'Post upvoted' })
  }

  async downvotePost({ response, request, bouncer }: HttpContext) {
    const { userId, postSlug } = await request.validateUsing(votePostValidator)
    const user = await User.query().where('id', userId).preload('profile').firstOrFail()
    const post = await Post.query().where('slug', postSlug).firstOrFail()
    if (await bouncer.with('PostPolicy').denies('vote', post)) {
      return response.forbidden({ message: "Can't downvote this post" })
    }
    await Profile.downvotePost(user.profile, post)
    return response.ok({ message: 'Post downvoted' })
  }

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
}
