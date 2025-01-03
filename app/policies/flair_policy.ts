import type User from '#models/user'
import Flair from '#models/flair'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import type Profile from '#models/profile'

export default class FlairPolicy extends BasePolicy {
  create(user: User, moderators: Profile[]) {
    if (user.isAdmin) return true
    const isMod = moderators.some((mod) => mod.userId === user?.id)
    return isMod
  }
  destory(user: User, moderators: Profile[]) {
    if (user.isAdmin) return true
    const isMod = moderators.some((mod) => mod.userId === user?.id)
    return isMod
  }
}
