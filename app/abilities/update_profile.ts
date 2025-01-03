import { Bouncer } from '@adonisjs/bouncer'
import type User from '#models/user'
import type Profile from '#models/profile'

export const updateProfile = Bouncer.ability((user: User, profile: Profile) => {
  return user.id === profile.userId
})
