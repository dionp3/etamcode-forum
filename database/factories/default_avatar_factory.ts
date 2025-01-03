import factory from '@adonisjs/lucid/factories'
import DefaultAvatar from '#models/default_avatar'

export const DefaultAvatarFactory = factory
  .define(DefaultAvatar, async () => {
    return {
      url: 'https://placehold.co/400',
    }
  })
  .build()
