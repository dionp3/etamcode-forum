import factory from '@adonisjs/lucid/factories'
import Forum from '#models/forum'
import { DefaultAvatarFactory } from './default_avatar_factory.js'
import { FlairFactory } from './flair_factory.js'
export const ForumFactory = factory
  .define(Forum, async ({ faker }) => {
    return {
      name: faker.person.fullName().toLowerCase(),
      description: faker.lorem.paragraph(),
      isRemoved: faker.datatype.boolean(),
      isDeleted: faker.datatype.boolean(),
      isHidden: faker.datatype.boolean(),
      isPostingRestricted: faker.datatype.boolean(),
      visibility: faker.helpers.arrayElement(['public', 'private', 'restricted']) as
        | 'public'
        | 'private'
        | 'restricted', // Explicitly typing this
    }
  })
  .relation('defaultIcon', () => DefaultAvatarFactory)
  .relation('flairs', () => FlairFactory)
  .build()
