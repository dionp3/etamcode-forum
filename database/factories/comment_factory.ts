import factory from '@adonisjs/lucid/factories'
import Comment from '#models/comment'
import { ProfileFactory } from './profile_factory.js'
import { PostFactory } from './post_factory.js'

export const CommentFactory = factory
  .define(Comment, async ({ faker }) => {
    return {
      content: faker.lorem.sentences({ min: 2, max: 4 }),
      isDeleted: faker.datatype.boolean(0.1),
      isRead: faker.datatype.boolean(0.1),
      isRemoved: faker.datatype.boolean(0.1),
    }
  })
  .relation('creator', ProfileFactory)
  .relation('post', PostFactory)
  .build()
