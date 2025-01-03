import factory from '@adonisjs/lucid/factories'
import Comment from '#models/comment'
import { ProfileFactory } from './profile_factory.js'
import { PostFactory } from './post_factory.js'

export const CommentFactory = factory
  .define(Comment, async ({ faker }) => {
    return {
      content: faker.lorem.sentences({ min: 2, max: 4 }),
      isDeleted: faker.helpers.arrayElement([true, false]),
      isRead: faker.helpers.arrayElement([true, false]),
      isRemoved: faker.helpers.arrayElement([true, false]),
    }
  })
  .relation('creator', ProfileFactory)
  .relation('post', PostFactory)
  .build()
