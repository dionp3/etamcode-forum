import Factory from '@adonisjs/lucid/factories'
import Post from '#models/post'
import { DateTime } from 'luxon'
import { UserFactory } from '#factories/user_factory'

export const PostFactory = Factory.define(Post, async ({ faker }) => {
  const hasImage = faker.helpers.arrayElement([true, false])
  return {
    title: faker.lorem.sentence().slice(0, 50),
    content: faker.lorem.paragraph(),
    hasImage: hasImage,
    imageUrl: hasImage ? 'https://placehold.co/600x400' : null,
    isRemoved: faker.helpers.arrayElement([true, false]),
    isLocked: faker.helpers.arrayElement([true, false]),
  }
})
  .relation('poster', () => UserFactory)
  .build()
