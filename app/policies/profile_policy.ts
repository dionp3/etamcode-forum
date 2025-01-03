import type User from '#models/user'
import type Profile from '#models/profile'
import type Post from '#models/post'
import { allowGuest, BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class ProfilePolicy extends BasePolicy {
  view(user: User): AuthorizerResponse {
    return user.isAdmin === true
  }

  @allowGuest()
  show(user: User | null, profile: Profile): AuthorizerResponse {
    if (user?.id !== profile.userId || user?.isAdmin === false || !user) {
      return true
    }

    return user.id === profile.userId || user.isAdmin
  }

  edit(user: User, profile: Profile): AuthorizerResponse {
    return user.id === profile.userId
  }

  delete(user: User, profile: Profile): AuthorizerResponse {
    return user.id === profile.userId || user.isAdmin
  }

  followForum(user: User, followers: Profile[]): AuthorizerResponse {
    const isFollower = followers.some((follower) => follower.userId === user.id)
    return !isFollower
  }

  unfollowForum(user: User, followers: Profile[]): AuthorizerResponse {
    const isFollower = followers.some((follower) => follower.userId === user.id)
    return isFollower
  }

  blockForum(user: User, blockers: Profile[]): AuthorizerResponse {
    const isBlocker = blockers.some((blocker) => blocker.userId === user.id)
    return !isBlocker
  }

  unblockForum(user: User, blockers: Profile[]): AuthorizerResponse {
    const isBlocker = blockers.some((blocker) => blocker.userId === user.id)
    return isBlocker
  }

  followUser(user: User, targetProfile: Profile, followings: Profile[]): AuthorizerResponse {
    if (user.id === targetProfile.userId) {
      return false
    }

    const isFollowing = followings.some((following) => targetProfile.userId === following.userId)
    if (isFollowing) {
      return false
    }
    return true
  }

  unfollow(user: User, profile: Profile, followings: Profile[]): AuthorizerResponse {
    if (user.id === profile.userId) {
      return false
    }
    const isFollowing = followings.some((following) => profile.userId === following.userId)
    if (isFollowing) {
      return true
    }

    return false
  }

  block(user: User, targetProfile: Profile, blockedProfiles: Profile[]): AuthorizerResponse {
    if (user.id === targetProfile.userId) {
      return false
    }

    if (targetProfile.user.isAdmin) return false

    const isAlreadyBlocked = blockedProfiles.some((profile) => profile.userId === targetProfile.userId)

    if (isAlreadyBlocked) {
      return false
    }

    return true
  }

  unblock(user: User, targetProfile: Profile, blockedProfiles: Profile[]): AuthorizerResponse {
    if (user.id === targetProfile.userId) {
      return false
    }

    // return true
    const isAlreadyBlocked = blockedProfiles.some((profile) => profile.userId === targetProfile.userId)

    if (isAlreadyBlocked) {
      return true
    }

    return false
  }

  hidePost(user: User, targetPost: Post, blockedPosts: Post[]): AuthorizerResponse {
    if (!user) return false
    if (user.id === targetPost.posterId) return false
    const alreadyHidden = blockedPosts.some((post) => post.id === targetPost.id)
    return !alreadyHidden
  }

  unhidePost(user: User, targetPost: Post, blockedPosts: Post[]): AuthorizerResponse {
    if (!user) return false
    if (user.id === targetPost.posterId) return false
    const alreadyHidden = blockedPosts.some((post) => post.id === targetPost.id)
    return alreadyHidden
  }
}
