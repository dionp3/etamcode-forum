import StarterSeeder from '#database/seeders/starter_seeder'
import Profile from '#models/profile'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

test.group('Profile pivot', (group) => {
  group.setup(async () => {
    await db.beginGlobalTransaction()
    const seeder = new StarterSeeder(db.connection())
    await seeder.run()
  })

  group.teardown(async () => {
    await db.rollbackGlobalTransaction()
  })
  test('Attach user follower with same ids', async ({ assert }) => {
    const user = await Profile.query().firstOrFail()
    await user.related('followings').attach([user.userId])
    await user.load('followings')
    console.log(user.followings)
  })
})
