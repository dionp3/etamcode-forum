import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import Profile from '#models/profile'
import User from '#models/user'
import TestSeeder from '#database/seeders/main/test_seeder'

test.group('Profile Pivot', (group) => {
  group.setup(async () => {
    await db.beginGlobalTransaction()

    const seeder = new TestSeeder(db.connection())
    await seeder.run()
  })

  group.teardown(async () => {
    await db.rollbackGlobalTransaction()
  })
  test('User can follow another user', async ({ assert, client }) => {
    const user1 = await Profile.query()
      .doesntHave('followings')
      .preload('followings')
      .preload('user')
      .firstOrFail()
    const user2 = await Profile.query()
      .preload('user')
      .doesntHave('followers')
      .whereNot('userId', user1.userId)
      .firstOrFail()

    const data = { currentUserId: user1.userId, targetUserId: user2.userId }

    const response = await client
      .post(`/api/u/${user2.user.username}/follow`)
      .form(data)
      .loginAs(user1.user)
      .withCsrfToken()
      .withInertia()

    console.log(data)
    console.log(response.body())
    assert.equal(response.status(), 200)
  })

  test('User can unfollow their followed users', async ({ assert, client }) => {
    const user1 = await Profile.query()
      .preload('user')
      .has('followings')
      .preload('followings', (query) => query.preload('user'))
      .firstOrFail()
    const data = { currentUserId: user1.userId, targetUserId: user1.followings[0].userId }
    const response = await client
      .post(`/api/u/${user1.followings[0].user.username}/unfollow`)
      .loginAs(user1.user)
      .form(data)
      .withCsrfToken()
    assert.equal(response.status(), 200)
  })

  test('User cannot follow themselves', async ({ assert, client }) => {
    const user1 = await User.findByOrFail('username', 'authorizeduser')

    const data = { currentUserId: user1.id, targetUserId: user1.id }

    const response = await client
      .post(`/api/u/${user1.username}/follow`)
      .form(data)
      .loginAs(user1)
      .withCsrfToken()

    console.log(response.body())
    console.log(response.status())
    assert.equal(response.status(), 403)
  })

  test('User can block another user', async ({ assert, client }) => {
    const user1 = await Profile.query().doesntHave('blockedProfiles').preload('user').firstOrFail()
    const user2 = await Profile.query()
      .preload('user')
      .doesntHave('profileBlockers')
      .whereNot('userId', user1.userId)
      .andWhereHas('user', (user) => user.where('isAdmin', false))
      .firstOrFail()
    console.log(user2.user.isAdmin)

    const data = { currentUserId: user1.userId, targetUserId: user2.userId }

    const response = await client
      .post(`/api/u/${user2.user.username}/block`)
      .form(data)
      .loginAs(user1.user)
      .withCsrfToken()

    const blockedProfilesByUser1 = await user1.related('blockedProfiles').query()
    console.log(response.body())
    console.log(response.status())
    assert.equal(response.status(), 200)
    assert.isNotEmpty(blockedProfilesByUser1)
  })

  test('User can unblock their blocked users', async ({ assert, client }) => {
    const user1 = await Profile.query()
      .has('blockedProfiles')
      .preload('user')
      .preload('blockedProfiles', (query) => query.preload('user'))
      .firstOrFail()
    const data = { currentUserId: user1.userId, targetUserId: user1.blockedProfiles[0].userId }
    const response = await client
      .post(`/api/u/${user1.blockedProfiles[0].user.username}/unblock`)
      .loginAs(user1.user)
      .form(data)
      .withCsrfToken()
    assert.equal(response.status(), 200)
  })

  test('User cannot block themselves', async ({ assert, client }) => {
    const user1 = await User.findByOrFail('username', 'authorizeduser')
    const data = { currentUserId: user1.id, targetUserId: user1.id }
    const response = await client
      .post(`/api/u/${user1.username}/block`)
      .form(data)
      .loginAs(user1)
      .withCsrfToken()
    console.log(response.body())
    console.log(response.status())
    assert.equal(response.status(), 403)
  })
})
