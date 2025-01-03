import { test } from '@japa/runner'

test.group('Google Oauth', () => {
  test('Client can visit the oauth redirect page', async ({ client }) => {
    const res = await client.get('/auth/google/redirect/')
    res.assertStatus(200)
  })

  test('Client can visit the oauth callback page', async ({ client }) => {
    const res = await client.get('/auth/google/callback/')
    res.assertStatus(200)
  })
})
