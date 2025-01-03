import TestSeeder from '#database/seeders/main/test_seeder'
import Forum from '#models/forum'
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

  test('Authenticated user can follow existent forum', async ({ assert, client }) => {
    const user = await User.findByOrFail('username', 'authorizeduser')
    const forums = await Forum.all()
    const response = await client
      .post(`/api/forums/${forums[0].id}/follow`)
      .loginAs(user)
      .form({
        currUserId: user.id,
        forumTargetId: forums[0].id,
      })
      .withCsrfToken()
      .withInertia()
    const forumFollowers = await forums[0].related('followers').query().firstOrFail()

    assert.equal(response.status(), 200)
    assert.isNotNull(forumFollowers)
  })

  test('Forum follower can unfollow their followed forum', async ({ assert, client }) => {
    const forums = await Forum.all()
    const forumFollower = await forums[0].related('followers').query().firstOrFail()
    await forumFollower.load('user')
    const response = await client
      .post(`/api/forums/${forums[0].id}/unfollow`)
      .loginAs(forumFollower.user)
      .form({
        currUserId: forumFollower.userId,
        forumTargetId: forums[0].id,
      })
      .withCsrfToken()
      .withInertia()

    const forumFollowersAfterUnfoll = await forums[0].related('followers').query()
    assert.equal(response.status(), 200)
    assert.isUndefined(forumFollowersAfterUnfoll[0])
  })
})
