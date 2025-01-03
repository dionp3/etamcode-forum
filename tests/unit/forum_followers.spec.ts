import TestSeeder from '#database/seeders/main/test_seeder'
import Forum from '#models/forum'
import Profile from '#models/profile'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

test.group('Forum followers', (group) => {
  group.setup(async () => {
    await db.beginGlobalTransaction()
    const seeder = new TestSeeder(db.connection())
    await seeder.run()
  })

  group.teardown(async () => {
    await db.rollbackGlobalTransaction()
  })
  test('Can attach user to forum follower', async ({ assert }) => {
    const user = await User.findByOrFail('username', 'authorizeduser')
    await user.load('profile')
    const forums = await Forum.all()
    await Profile.followForum(user.profile, forums[0])
    const addedFollower = await forums[0].related('followers').query().where('profile_id', user.id).first()
    assert.isNotNull(addedFollower)
  })
})
