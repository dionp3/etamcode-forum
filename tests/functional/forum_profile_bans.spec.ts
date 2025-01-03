import TestSeeder from '#database/seeders/main/test_seeder'
import Forum from '#models/forum'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

test.group('Forum profile bans', (g) => {
  g.setup(async () => {
    await db.beginGlobalTransaction()
    const seeder = new TestSeeder(db.connection())
    await seeder.run()
  })

  g.teardown(async () => {
    await db.rollbackGlobalTransaction()
  })
  // test('Authorized user can ban a user/profile', async ({ assert, client }) => {
  //   const forumWithModsAndFollowers = await Forum.query()
  //     .whereHas('moderators', (query) => {})
  //     .andWhereHas('followers', (query) => {})
  //     .firstOrFail()
  //
  //   const mod = await forumWithModsAndFollowers.related('moderators').query().firstOrFail()
  //   const followers = await forumWithModsAndFollowers.related('followers').query()
  //
  //   console.log(mod)
  //   console.log('followers: ', followers)
  // })
  // test('Authorized user can unban a user/profile', async ({ assert, client }) => {})
  // test('Unauthorized user cannot ban a user/profile', async ({ assert , client}) => {})
  // test('Unauthorized user cannot unban a user/profile', async ({ assert, client }) => {})
})
