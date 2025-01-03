import factory from '@adonisjs/lucid/factories'
import Avatar from '#models/avatar'

export const AvatarFactory = factory
  .define(Avatar, async () => {
    return {
      url: 'https://placehold.co/400',
    }
  })
  .build()
