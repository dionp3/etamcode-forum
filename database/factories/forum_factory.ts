import factory from '@adonisjs/lucid/factories'
import Forum from '#models/forum'
import { FlairFactory } from './flair_factory.js'
export const ForumFactory = factory
  .define(Forum, async ({ faker }) => {
    return {
      name: faker.person.fullName().toLowerCase(),
      description: faker.lorem.paragraph(),
      isRemoved: faker.datatype.boolean(0.1),
      isDeleted: faker.datatype.boolean(0.1),
      isHidden: faker.datatype.boolean(0.1),
      isPostingRestricted: faker.datatype.boolean(0.1),
      visibility: faker.helpers.arrayElement(['public', 'private', 'restricted']) as
        | 'public'
        | 'private'
        | 'restricted', // Explicitly typing this
    }
  })
  .relation('flairs', () => FlairFactory)
  .build()
