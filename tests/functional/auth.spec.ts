import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

test.group('Authentication', (group) => {
  group.setup(async () => {
    await db.beginGlobalTransaction()
  })

  group.teardown(async () => {
    await db.rollbackGlobalTransaction()
  })

  /**
   * Registration tests
   */
  test('User can register an account', async ({ assert, client }) => {
    const response = await client
      .post('/auth/register')
      .form({
        email: 'testregister@example.com',
        username: 'testregister',
        password: 'testregister123',
      })
      .withCsrfToken()
      .withInertia()

    const user = await User.findByOrFail('username', 'testregister')
    const redirectResponse = await client.get('/').loginAs(user).withInertia()
    redirectResponse.assertInertiaComponent('home')
    redirectResponse.assertInertiaPropsContains({
      isAuth: true,
    })
    assert.equal(redirectResponse.status(), 200)
    assert.exists(user)
    assert.isNotNull(user)
  })

  test('Registered account has its own profile', async ({ assert }) => {
    const users = await User.all()
    const userProfiles = users.map((user) => user.load('profile'))
    assert.exists(userProfiles)
  })

  /**
   * Login/Logout tests
   */
  test('User with registered account can login', async ({ assert, client }) => {
    const response = await client
      .post('/auth/login')
      .form({
        email: 'testregister@example.com',
        password: 'testregister123',
      })
      .withCsrfToken()

    assert.equal(response.status(), 200)
  })

  test('Logged in user can logout', async ({ assert, client }) => {
    const user = await User.findByOrFail('email', 'testregister@example.com')
    const response = await client.post('/auth/logout').loginAs(user)

    assert.equal(response.status(), 200)
  })
})
