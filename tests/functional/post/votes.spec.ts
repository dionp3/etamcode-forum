import TestSeeder from '#database/seeders/main/test_seeder'
import Post from '#models/post'
import Profile from '#models/profile'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

test.group('Post votes', (g) => {
  g.setup(async () => {
    await db.beginGlobalTransaction()

    const seeder = new TestSeeder(db.connection())
    await seeder.run()
  })

  g.teardown(async () => {
    await db.rollbackGlobalTransaction()
  })

  test('Returns 200 when authenticated user upvotes a non restricted posts', async ({ assert, client }) => {
    const post = await Post.query().where('isRemoved', false).preload('forum').preload('voters').firstOrFail()
    const user = await User.findByOrFail('username', 'authorizeduser')
    const data = { userId: user.id, postSlug: post.slug }
    const response = await client
      .post(`/api/f/${post.forum.name}/posts/${post.slug}/upvote`)
      .loginAs(user)
      .form(data)
      .withCsrfToken()
    assert.equal(response.status(), 200)
    assert.equal(response.body().message, 'Post upvoted')
    await post.refresh()
    await post.load('voters')
    const vote = post.voters.find((voter) => voter.userId === user.id)
    assert.exists(vote)
    assert.equal(vote?.$extras.pivot_score, 1)
  })

  test('Returns 401/200 (redirects to home to login) when unauthenticated user upvotes non restricted posts', async ({
    assert,
    client,
  }) => {
    const user = await User.findByOrFail('username', 'authorizeduser')
    const post = await Post.query().where('isRemoved', false).preload('forum').preload('voters').firstOrFail()
    const data = { userId: user.id, postSlug: post.slug }
    const response = await client
      .post(`/api/f/${post.forum.name}/posts/${post.slug}/upvote`)
      .form(data)
      .withCsrfToken()
      .withInertia()
    assert.equal(response.status(), 200)
    assert.equal(response.body().props.isAuth, false)
  })

  test('Returns 200 when authenticated user downvotes a non restricted post', async ({ assert, client }) => {
    const post = await Post.query().where('isRemoved', false).preload('forum').preload('voters').firstOrFail()
    const user = await User.findByOrFail('username', 'authorizeduser')
    const data = { userId: user.id, postSlug: post.slug }
    const response = await client
      .post(`/api/f/${post.forum.name}/posts/${post.slug}/downvote`)
      .loginAs(user)
      .form(data)
      .withCsrfToken()
    assert.equal(response.status(), 200)
    assert.equal(response.body().message, 'Post downvoted')
    await post.refresh()
    await post.load('voters')
    const vote = post.voters.find((voter) => voter.userId === user.id)
    assert.exists(vote)
    assert.equal(vote?.$extras.pivot_score, -1)
  })

  test('Returns 401/200 (redirects to home to login) when unauthenticated user downvotes non restricted posts', async ({
    assert,
    client,
  }) => {
    const user = await User.findByOrFail('username', 'authorizeduser')
    const post = await Post.query().where('isRemoved', false).preload('forum').preload('voters').firstOrFail()
    const data = { userId: user.id, postSlug: post.slug }
    const response = await client
      .post(`/api/f/${post.forum.name}/posts/${post.slug}/downvote`)
      .form(data)
      .withCsrfToken()
      .withInertia()
    assert.equal(response.status(), 200)
    assert.equal(response.body().props.isAuth, false)
  })

  test('Returns 403 when authenticated user upvotes restricted posts', async ({ assert, client }) => {
    const post = await Post.query().where('isRemoved', true).preload('forum').preload('voters').firstOrFail()
    const user = await User.findByOrFail('username', 'authorizeduser')
    const data = { userId: user.id, postSlug: post.slug }
    const response = await client
      .post(`/api/f/${post.forum.name}/posts/${post.slug}/upvote`)
      .loginAs(user)
      .form(data)
      .withCsrfToken()
    assert.equal(response.status(), 403)
    assert.equal(response.body().message, "Can't upvote this post")
  })

  test('Returns 403 when authenticated user downvotes restricted posts', async ({ assert, client }) => {
    const post = await Post.query().where('isRemoved', true).preload('forum').preload('voters').firstOrFail()
    const user = await User.findByOrFail('username', 'authorizeduser')
    const data = { userId: user.id, postSlug: post.slug }
    const response = await client
      .post(`/api/f/${post.forum.name}/posts/${post.slug}/downvote`)
      .loginAs(user)
      .form(data)
      .withCsrfToken()
    assert.equal(response.status(), 403)
    assert.equal(response.body().message, "Can't downvote this post")
  })

  test('Returns 200 and switch upvote and downvote', async ({ assert, client }) => {
    const post = await Post.query().where('isRemoved', false).doesntHave('voters').preload('forum').firstOrFail()
    const user = await User.findByOrFail('username', 'authorizeduser')
    await user.load('profile')
    const data = { userId: user.id, postSlug: post.slug }
    const upvoteResponse = await client
      .post(`/api/f/${post.forum.name}/posts/${post.slug}/upvote`)
      .loginAs(user)
      .form(data)
      .withCsrfToken()

    assert.equal(upvoteResponse.status(), 200)
    assert.equal(upvoteResponse.body().message, 'Post upvoted')

    await post.refresh()
    await post.load('voters')
    const upvotePost = post.voters.find((voter) => voter.userId === user.id)
    assert.exists(upvotePost)
    assert.equal(upvotePost?.$extras.pivot_score, 1)

    const downvoteResponse = await client
      .post(`/api/f/${post.forum.name}/posts/${post.slug}/downvote`)
      .loginAs(user)
      .form(data)
      .withCsrfToken()
    assert.equal(downvoteResponse.status(), 200)
    assert.equal(downvoteResponse.body().message, 'Post downvoted')
    await post.refresh()
    await post.load('voters')
    const downvotePost = post.voters.find((voter) => voter.userId === user.id)
    assert.exists(downvotePost)
    assert.equal(downvotePost?.$extras.pivot_score, -1)
  })
})
