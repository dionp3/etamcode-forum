import TestSeeder from '#database/seeders/main/test_seeder'
import Forum from '#models/forum'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

test.group('Forum blocks', (group) => {
  group.setup(async () => {
    await db.beginGlobalTransaction()
    const seeder = new TestSeeder(db.connection())
    await seeder.run()
  })

  group.teardown(async () => {
    await db.rollbackGlobalTransaction()
  })

  test('Authenticated user can block forum', async ({ assert, client }) => {
    const user = await User.findByOrFail('username', 'authorizeduser')
    const forums = await Forum.all()
    const response = await client
      .post(`/api/forums/${forums[5].id}/block`)
      .form({
        currUserId: user.id,
        forumTargetId: forums[5].id,
      })
      .loginAs(user)
      .withCsrfToken()
      .withInertia()

    await user.load('profile')
    const blockedForums = await user.profile.related('blockedForums').query()
    // console.log(blockedForums)
    assert.equal(response.status(), 200)
    assert.isNotNull(blockedForums)
  })

  test('Authenticated user can unblock the forums they blocked', async ({ assert, client }) => {
    const user = await User.findByOrFail('username', 'authorizeduser')
    await user.load('profile')
    const userProfile = user.profile
    let blockedForums = await userProfile.related('blockedForums').query()
    assert.isNotNull(blockedForums)

    const response = await client
      .post(`/api/forums/${blockedForums[0].id}/unblock`)
      .loginAs(user)
      .form({
        currUserId: user.id,
        forumTargetId: blockedForums[0].id,
      })
      .withCsrfToken()
      .withInertia()

    assert.equal(response.status(), 200)
    blockedForums = await userProfile.related('blockedForums').query()
    assert.isUndefined(blockedForums[0])
  })
})
