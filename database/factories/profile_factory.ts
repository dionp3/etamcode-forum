import factory from '@adonisjs/lucid/factories'
import Profile from '#models/profile'
import { AvatarFactory } from './avatar_factory.js'

export const ProfileFactory = factory
  .define(Profile, async ({ faker }) => {
    return {}
  })
  .build()
