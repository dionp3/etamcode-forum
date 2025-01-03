import TestSeeder from '#database/seeders/main/test_seeder'
import Post from '#models/post'
import Profile from '#models/profile'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

test.group('Post relations', (group) => {
  group.setup(async () => {
    await db.beginGlobalTransaction()
    const seeder = new TestSeeder(db.connection())
    await seeder.run()
  })

  group.teardown(async () => {
    await db.rollbackGlobalTransaction()
  })

  test('Can get all posts', async ({ assert }) => {
    const posts = await Post.query().has('poster').preload('poster')
    assert.isNotNull(posts[0].poster)
    assert.isNotNull(posts)
  })

  test('Can get all profile with posts', async ({ assert }) => {
    const profiles = await Profile.query().has('posts').preload('posts')
    assert.isNotNull(profiles[0].posts)
    assert.isNotNull(profiles)
  })
})
