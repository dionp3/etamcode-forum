import TestSeeder from '#database/seeders/main/test_seeder'
import Forum from '#models/forum'
import Profile from '#models/profile'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

test.group('Forum moderators', (g) => {
  g.setup(async () => {
    await db.beginGlobalTransaction()
    const seeder = new TestSeeder(db.connection())
    await seeder.run()
  })

  g.teardown(async () => {
    await db.rollbackGlobalTransaction()
  })

  test('Forum creator can add another moderator', async ({ assert, client }) => {
    const forumWithCreator = await Forum.query()
      .whereHas('moderators', () => {})
      .firstOrFail()
    let forumModerators = await forumWithCreator.related('moderators').query().orderBy('pivot_created_at', 'asc')
    const forumCreator = forumModerators[0]
    await forumCreator.load('user')
    const regularUser = await Profile.query()
      .whereDoesntHave('moderatedForums', () => {})
      .firstOrFail()
    const response = await client
      .post(`/api/forums/${forumWithCreator.id}/moderators`)
      .loginAs(forumCreator.user)
      .form({
        forumId: forumWithCreator.id,
        userId: regularUser.userId,
      })
      .withCsrfToken()
      .withInertia()

    forumModerators = await forumWithCreator.related('moderators').query().orderBy('pivot_created_at', 'desc')
    assert.equal(response.status(), 200)
    assert.equal(forumModerators[0].userId, regularUser.userId)
  })

  test('Forum moderator can add another user as moderator', async ({ assert, client }) => {
    const forumWithModerators = await Forum.query()
      .has('moderators', '<=', 3)
      .andHas('moderators', '>', 1)
      .firstOrFail()
    let forumModerators = await forumWithModerators.related('moderators').query().orderBy('pivot_created_at', 'asc')
    assert.approximately(forumModerators.length, 2, 3)
    const forumMod = forumModerators[1]
    await forumMod.load('user')
    const regularUser = await Profile.query()
      .whereDoesntHave('moderatedForums', () => {})
      .firstOrFail()
    const response = await client
      .post(`/api/forums/${forumWithModerators.id}/moderators`)
      .loginAs(forumMod.user)
      .form({
        forumId: forumWithModerators.id,
        userId: regularUser.userId,
      })
      .withCsrfToken()
      .withInertia()

    forumModerators = await forumWithModerators.related('moderators').query().orderBy('pivot_created_at', 'desc')
    assert.equal(response.status(), 200)
    assert.equal(forumModerators[0].userId, regularUser.userId)
  })

  test('Non forum creator user cannot delete their moderated forum', async ({ assert, client }) => {
    const forumWithModerators = await Forum.query()
      .has('moderators', '<=', 3)
      .andHas('moderators', '>', 1)
      .firstOrFail()
    const forumModerators = await forumWithModerators.related('moderators').query().orderBy('pivot_created_at', 'asc')
    assert.approximately(forumModerators.length, 2, 3)
    const forumMod = forumModerators[1]
    await forumMod.load('user')
    const response = await client
      .delete(`/api/forums/${forumWithModerators.id}`)
      .loginAs(forumMod.user)
      .withCsrfToken()
      .withInertia()
    const forumToDelete = await Forum.findOrFail(forumWithModerators.id)

    assert.equal(response.status(), 403)
    assert.exists(forumToDelete)
  })
})
