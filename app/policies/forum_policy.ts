import User from '#models/user'
import Forum from '#models/forum'
import { allowGuest, AuthorizationResponse, BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import Profile from '#models/profile'

export default class ForumPolicy extends BasePolicy {
  @allowGuest()
  show(
    user: User | null,
    moderators: Profile[],
    creator: Profile,
    forum: Forum
  ): AuthorizerResponse {
    if (user?.isAdmin) return true

    const isMod = moderators.some((mod) => mod?.userId === user?.id)

    if (forum.isDeleted) {
      return false
    }

    if (forum.isHidden || forum.isRemoved) {
      return user ? isMod || user.id === creator?.userId : false
    }
    return true
  }

  update(user: User, moderators: Profile[]): AuthorizerResponse {
    if (user.isAdmin) {
      return true
    }
    const isMod = moderators.some((mod) => mod.userId === user.id)
    return isMod
  }

  destroy(user: User, forumCreator: Profile): AuthorizerResponse {
    if (user.isAdmin) {
      return true
    }

    if (forumCreator && forumCreator.userId === user.id) {
      return true
    }

    return false
  }

  addModerator(user: User, targetProfile: Profile, moderators: Profile[]): AuthorizerResponse {
    if (user.isAdmin) return true
    if (user.id === targetProfile.userId) return false
    const isMod = moderators.some((mods) => mods?.userId === user.id)
    return isMod
  }

  removeModerator(user: User, targetProfile: Profile, forumCreator: Profile): AuthorizerResponse {
    if (user.isAdmin) return true
    if (user.id === targetProfile.userId) return false
    if (targetProfile.userId === forumCreator.userId) return false

    return true
  }

  removeFollower(user: User, targetProfile: Profile, moderators: Profile[]): AuthorizerResponse {
    if (user.isAdmin) return true
    if (targetProfile.userId === user?.id) return false
    const isMod = moderators.some((mod) => mod.userId === user?.id)

    return isMod
  }

  banProfile(user: User, targetProfile: Profile, moderators: Profile[]): AuthorizerResponse {
    if (user.isAdmin) return true
    if (targetProfile.userId === user?.id) return false

    const isMod = moderators.some((mod) => mod.userId === user?.id)

    return isMod
  }
}
