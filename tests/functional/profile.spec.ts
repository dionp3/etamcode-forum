import User from '#models/user'
import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import StarterSeeder from '#database/seeders/starter_seeder'
// import { assert } from 'console'

test.group('Profile', (group) => {
  group.setup(async () => {
    await db.beginGlobalTransaction()

    const seeder = new StarterSeeder(db.connection())
    await seeder.run()
  })

  group.teardown(async () => {
    await db.rollbackGlobalTransaction()
  })

  test('Admin can see list of users/profiles', async ({ client, assert }) => {
    const admin = await User.findByOrFail('username', 'admin')
    const response = await client.get('/admin/profiles').loginAs(admin)
    assert.equal(response.status(), 200)
    assert.exists(response.body())
  })

  test("Unauthorized user can't see list of users/profiles", async ({ client, assert }) => {
    const unauthorizedUser = await User.findByOrFail('username', 'unauthorizeduser')
    const response = await client.get('/admin/profiles').loginAs(unauthorizedUser)
    assert.equal(response.status(), 403)
  })

  test('Authorized user can see their own profile', async ({ assert, client }) => {
    const authorizedUser = await User.findByOrFail('username', 'authorizeduser')
    const response = await client.get(`/api/u/${authorizedUser.username}`).loginAs(authorizedUser)
    await authorizedUser.load('profile')

    const profileData = response.body()
    assert.equal(response.status(), 200)
    assert.exists(profileData, 'Profile data should exist in the response')
    assert.equal(profileData.profile.user.username, authorizedUser.username)
    assert.equal(profileData.profile.user.email, authorizedUser.email)
    assert.equal(profileData.profile.bio, "I'm an authorized user.")
  })

  test('Unauthenticated user can see another profile', async ({ assert, client }) => {
    const authorizedUser = await User.findByOrFail('username', 'authorizeduser')
    const response = await client.get(`/api/u/${authorizedUser.username}`)
    await authorizedUser.load('profile')

    const profileData = response.body()
    assert.equal(response.status(), 200)
    assert.exists(profileData, 'Profile data should exist in the response')
    assert.equal(profileData.profile.user.username, authorizedUser.username)
    assert.equal(profileData.profile.user.email, authorizedUser.email)
    assert.equal(profileData.profile.bio, "I'm an authorized user.")
  })

  test("Unauthorized user can see another user's profile", async ({ assert, client }) => {
    const authorizedUser = await User.findByOrFail('username', 'authorizeduser')
    const unauthorizedUser = await User.findByOrFail('username', 'unauthorizeduser')
    await unauthorizedUser.load('profile')
    const response = await client.get(`/api/u/${authorizedUser.username}`).loginAs(unauthorizedUser)

    const profileData = response.body()
    assert.equal(response.status(), 200)
    assert.exists(profileData, 'Profile data should exist in the response')
    assert.equal(profileData.profile.user.username, authorizedUser.username)
    assert.equal(profileData.profile.bio, "I'm an authorized user.")
    assert.notEqual(profileData.profile.user.username, unauthorizedUser.username)
    assert.notEqual(profileData.profile.displayName, unauthorizedUser.profile.displayName)
  })

  test("Unauthorized user can't update another profile", async ({ client, assert }) => {
    const unauthorizedUser = await User.findByOrFail('username', 'unauthorizeduser')
    const authorizedUser = await User.findByOrFail('username', 'authorizeduser')
    const response = await client
      .put(`/api/u/${authorizedUser.username}`)
      .loginAs(unauthorizedUser)
      .form({ bio: 'New bio' })
      .withCsrfToken()

    assert.equal(response.status(), 403)
  })

  test('Authorized user can update their own profile', async ({ client, assert }) => {
    const authorizedUser = await User.findByOrFail('email', 'authorized@gmail.com')

    // Log user profile before the update
    await authorizedUser.load('profile')
    // console.log('Profile before update:', authorizedUser.profile)

    const response = await client
      .put(`/api/u/${authorizedUser.username}`)
      .loginAs(authorizedUser)
      .form({ bio: "I'm authorized" })
      .withCsrfToken()
      .withInertia()

    await authorizedUser.load('profile') // Load the user's profile
    const userProfile = authorizedUser.profile // Get the loaded profile

    // console.log('Profile Bio: ', authorizedUser.profile.bio)
    assert.equal(response.status(), 200)
    assert.exists(userProfile, 'Profile should be loaded')
    assert.equal(userProfile.bio, "I'm authorized") // Ensure the bio was updated correctly
  })

  test("Unauthorized user can't delete another profile", async ({ client, assert }) => {
    const authorizedUser = await User.findByOrFail('username', 'authorizeduser')
    const unauthorizedUser = await User.findByOrFail('username', 'unauthorizeduser')
    const response = await client.delete(`/api/u/${authorizedUser.username}`).loginAs(unauthorizedUser).withCsrfToken()
    assert.equal(response.status(), 403)
  })

  test('Authorized user can delete their own profile', async ({ client, assert }) => {
    const user = await User.findByOrFail('email', 'authorized@gmail.com')
    const response = await client.delete(`/api/u/${user.username}`).loginAs(user)
    assert.equal(response.status(), 200)
  })
})
