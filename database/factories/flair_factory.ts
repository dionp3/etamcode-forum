import factory from '@adonisjs/lucid/factories'
import Flair from '#models/flair'
import { ForumFactory } from './forum_factory.js'

export const FlairFactory = factory
  .define(Flair, async ({ faker }) => {
    return {
      name: faker.lorem.word(),
      color: faker.color.rgb(),
    }
  })
  .relation('forum', () => ForumFactory)
  .build()
