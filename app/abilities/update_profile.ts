import { Bouncer } from '@adonisjs/bouncer'
import User from '#models/user'
import Profile from '#models/profile'

export const updateProfile = Bouncer.ability((user: User, profile: Profile) => {
  return user.id === profile.userId
})
