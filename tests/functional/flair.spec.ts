import TestSeeder from '#database/seeders/main/test_seeder'
import StarterSeeder from '#database/seeders/starter_seeder'
import Flair from '#models/flair'
import Forum from '#models/forum'
import Profile from '#models/profile'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

test.group('Flair', (group) => {
  group.setup(async () => {
    await db.beginGlobalTransaction()

    const seeder = new TestSeeder(db.connection())
    await seeder.run()
  })

  group.teardown(async () => {
    await db.rollbackGlobalTransaction()
  })

  test('See list of flairs in forum', async ({ assert, client }) => {
    const forumWithFlairs = await db
      .query()
      .from('forums')
      .join('flairs', 'forums.id', 'flairs.forum_id')
      .select('forums.*')
      .first()

    // Make sure a forum with flairs exists
    assert.isNotNull(forumWithFlairs, 'No forum with flairs found')

    // Find the admin user
    const admin = await User.findByOrFail('username', 'admin')

    // Make a request to see the list of flairs for the selected forum
    const response = await client.get(`/api/forums/${forumWithFlairs.id}/flairs`).loginAs(admin)

    // Check if the status is 200
    response.assertStatus(200)

    // Check if the response contains the list of flairs
    const data = response.body()
    assert.isNotEmpty(data, 'Flair list is empty')
    assert.equal(
      data.data[0].forumId,
      forumWithFlairs.id,
      'Flairs do not belong to the correct forum'
    )
  })

  test('Authorized user can add flair to their forum', async ({ assert, client }) => {
    const moderators = await db.query().from('forum_moderators')
    const moderatorId: number = moderators[0].profile_id
    const moderatorProfile = await Profile.findByOrFail('userId', moderatorId)
    await moderatorProfile.load('user')
    const moderatedForum: Forum = await moderatorProfile
      .related('moderatedForums')
      .query()
      .firstOrFail()

    const response = await client
      .post(`/api/forums/${moderatedForum.id}/flairs`)
      .form({
        forumId: moderatedForum.id,
        name: 'Help',
        color: '#FFFFFF',
      })
      .loginAs(moderatorProfile.user)
      .withCsrfToken()
      .withInertia()
    assert.equal(response.status(), 201, 'Should be 201')
    const createdFlair = await Flair.find(response.body().data.id)
    assert.isNotNull(createdFlair, 'Created flair should exist in the database')
    if (createdFlair) {
      assert.equal(createdFlair.name, 'Help', 'Created flair should have the correct name')
      assert.equal(createdFlair.color, '#FFFFFF', 'Created flair should have the correct color')
      assert.equal(
        createdFlair.forumId,
        moderatedForum.id,
        'Created flair should be associated with the correct forum'
      )
    }
  })

  test('Authorized user can modify flairs', async ({ assert, client }) => {
    const moderators = await db.query().from('forum_moderators')
    // console.log(moderators)
    const moderatorId: number = moderators[0].profile_id
    const moderatorProfile = await Profile.findByOrFail('userId', moderatorId)
    // console.log(moderatorProfile)
    await moderatorProfile.load('user')
    const moderatedForum: Forum = await moderatorProfile
      .related('moderatedForums')
      .query()
      .firstOrFail()
    // console.log(moderatedForum)
    const forumFlairs = await moderatedForum.related('flairs').query()
    // console.log(forumFlairs)

    const response = await client
      .patch(`/api/forums/${moderatedForum.id}/flairs/${forumFlairs[0].id}`)
      .loginAs(moderatorProfile.user)
      .form({
        forumId: moderatedForum.id,
        name: 'Help Wanted',
        color: '#FF0000',
      })
      .withCsrfToken()
      .withInertia()
    assert.equal(response.status(), 200, 'Should be 200')
    const modifiedFlair = await Flair.find(response.body().data.id)
    assert.isNotNull(modifiedFlair, 'Created flair should not exist in the database')
    if (modifiedFlair) assert.equal(modifiedFlair.name, 'Help Wanted')
  })

  test('Authorized user can delete flair on their forum', async ({ assert, client }) => {
    const moderators = await db.query().from('forum_moderators')
    // console.log(moderators)
    const moderatorId: number = moderators[0].profile_id
    const moderatorProfile = await Profile.findByOrFail('userId', moderatorId)
    // console.log(moderatorProfile)
    await moderatorProfile.load('user')
    const moderatedForum: Forum = await moderatorProfile
      .related('moderatedForums')
      .query()
      .firstOrFail()
    // console.log(moderatedForum)
    const forumFlairs = await moderatedForum.related('flairs').query()
    // console.log(forumFlairs)

    const response = await client
      .delete(`/api/forums/${moderatedForum.id}/flairs/${forumFlairs[0].id}`)
      .loginAs(moderatorProfile.user)
      .withCsrfToken()
      .withInertia()
    assert.equal(response.status(), 200, 'Should be 200')
    const createdFlair = await Flair.find(response.body().data.id)
    assert.isNull(createdFlair, 'Created flair should not exist in the database')
    // if (createdFlair) {
    //   assert.equal(createdFlair.name, 'Help', 'Created flair should have the correct name')
    //   assert.equal(createdFlair.color, '#FFFFFF', 'Created flair should have the correct color')
    //   assert.equal(
    //     createdFlair.forumId,
    //     moderatedForum.id,
    //     'Created flair should be associated with the correct forum'
    //   )
    // }
  })
})
