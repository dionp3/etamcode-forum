import { test } from '@japa/runner'
import Comment from '#models/comment'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import TestSeeder from '#database/seeders/main/test_seeder'

test.group('Comment votes', (g) => {
  g.setup(async () => {
    await db.beginGlobalTransaction()

    const seeder = new TestSeeder(db.connection())
    await seeder.run()
  })

  g.teardown(async () => {
    await db.rollbackGlobalTransaction()
  })
  test('Returns 200 when authenticated user upvotes a non restricted comments', async ({ assert, client }) => {
    const comment = await Comment.query()
      .where('isRemoved', false)
      .andWhere('isDeleted', false)
      .whereHas('post', (p) => p.where('isRemoved', false))
      .preload('post', (post) => post.preload('forum'))
      .preload('voters')
      .firstOrFail()

    const user = await User.findByOrFail('username', 'authorizeduser')
    const data = { userId: user.id, commentSlug: comment.slug }
    const response = await client
      .post(`/api/f/${comment.post.forum.name}/posts/${comment.post.slug}/comments/${comment.slug}/upvote`)
      .loginAs(user)
      .form(data)
      .withCsrfToken()
    assert.equal(response.status(), 200)
    assert.equal(response.body().message, 'Comment upvoted')
    await comment.refresh()
    await comment.load('voters')
    const vote = comment.voters.find((voter) => voter.userId === user.id)
    assert.exists(vote)
    assert.equal(vote?.$extras.pivot_score, 1)
    assert.equal(vote?.$extras.pivot_post_id, comment.postId)
  })

  test('Returns 401/200 (redirects to home to login) when unauthenticated user upvotes non restricted comments', async ({
    assert,
    client,
  }) => {
    const comment = await Comment.query()
      .doesntHave('voters')
      .where('isRemoved', false)
      .andWhere('isDeleted', false)
      .whereHas('post', (p) => p.where('isRemoved', false))
      .preload('post', (post) => post.preload('forum'))
      .preload('voters')
      .firstOrFail()

    const user = await User.findByOrFail('username', 'authorizeduser')
    const data = { userId: user.id, commentSlug: comment.slug }
    const response = await client
      .post(`/api/f/${comment.post.forum.name}/posts/${comment.post.slug}/comments/${comment.slug}/upvote`)
      .form(data)
      .withCsrfToken()
      .withInertia()
    assert.equal(response.status(), 200)
    assert.equal(response.body().props.isAuth, false)
    await comment.refresh()
    await comment.load('voters')
    assert.isEmpty(comment.voters)
  })

  test('Returns 200 when authenticated user downvotes a non restricted comments', async ({ assert, client }) => {
    const comment = await Comment.query()
      .where('isRemoved', false)
      .andWhere('isDeleted', false)
      .whereHas('post', (p) => p.where('isRemoved', false))
      .preload('post', (post) => post.preload('forum'))
      .preload('voters')
      .firstOrFail()

    const user = await User.findByOrFail('username', 'authorizeduser')
    const data = { userId: user.id, commentSlug: comment.slug }
    const response = await client
      .post(`/api/f/${comment.post.forum.name}/posts/${comment.post.slug}/comments/${comment.slug}/downvote`)
      .loginAs(user)
      .form(data)
      .withCsrfToken()

    assert.equal(response.status(), 200)
    assert.equal(response.body().message, 'Comment downvoted')
    await comment.refresh()
    await comment.load('voters')
    const vote = comment.voters.find((voter) => voter.userId === user.id)
    assert.exists(vote)
    assert.equal(vote?.$extras.pivot_score, -1)
    assert.equal(vote?.$extras.pivot_post_id, comment.postId)
  })

  test('Returns 401/200 (redirects to home to login) when unauthenticated user downvotes non restricted comments', async ({
    assert,
    client,
  }) => {
    const comment = await Comment.query()
      .doesntHave('voters')
      .where('isRemoved', false)
      .andWhere('isDeleted', false)
      .whereHas('post', (p) => p.where('isRemoved', false))
      .preload('post', (post) => post.preload('forum'))
      .preload('voters')
      .firstOrFail()

    const user = await User.findByOrFail('username', 'authorizeduser')
    const data = { userId: user.id, commentSlug: comment.slug }
    const response = await client
      .post(`/api/f/${comment.post.forum.name}/posts/${comment.post.slug}/comments/${comment.slug}/downvote`)
      .form(data)
      .withCsrfToken()
      .withInertia()
    assert.equal(response.status(), 200)
    assert.equal(response.body().props.isAuth, false)
    await comment.refresh()
    await comment.load('voters')
    assert.isEmpty(comment.voters)
  })

  test('Returns 403 when authenticated user upvotes restricted comments', async ({ assert, client }) => {
    const comment = await Comment.query()
      .where('isRemoved', false)
      .andWhere('isDeleted', false)
      .whereHas('post', (p) => p.where('isRemoved', true))
      .preload('post', (post) => post.preload('forum'))
      .preload('voters')
      .firstOrFail()

    const user = await User.findByOrFail('username', 'authorizeduser')
    const data = { userId: user.id, commentSlug: comment.slug }
    const response = await client
      .post(`/api/f/${comment.post.forum.name}/posts/${comment.post.slug}/comments/${comment.slug}/upvote`)
      .loginAs(user)
      .form(data)
      .withCsrfToken()
    assert.equal(response.status(), 403)
  })

  test('Returns 403 when authenticated user downvotes restricted posts', async ({ assert, client }) => {
    const comment = await Comment.query()
      .where('isRemoved', false)
      .andWhere('isDeleted', false)
      .whereHas('post', (p) => p.where('isRemoved', true))
      .preload('post', (post) => post.preload('forum'))
      .preload('voters')
      .firstOrFail()

    const user = await User.findByOrFail('username', 'authorizeduser')
    const data = { userId: user.id, commentSlug: comment.slug }
    const response = await client
      .post(`/api/f/${comment.post.forum.name}/posts/${comment.post.slug}/comments/${comment.slug}/downvote`)
      .loginAs(user)
      .form(data)
      .withCsrfToken()
    assert.equal(response.status(), 403)
  })

  test('Returns 200 and switch upvote to downvote', async ({ assert, client }) => {
    const comment = await Comment.query()
      .where('isRemoved', false)
      .andWhere('isDeleted', false)
      .whereHas('post', (p) => p.where('isRemoved', false))
      .preload('post', (post) => post.preload('forum'))
      .preload('voters')
      .firstOrFail()

    const user = await User.findByOrFail('username', 'authorizeduser')
    const data = { userId: user.id, commentSlug: comment.slug }
    const upvoteResponse = await client
      .post(`/api/f/${comment.post.forum.name}/posts/${comment.post.slug}/comments/${comment.slug}/upvote`)
      .loginAs(user)
      .form(data)
      .withCsrfToken()
    assert.equal(upvoteResponse.status(), 200)
    assert.equal(upvoteResponse.body().message, 'Comment upvoted')

    const downvoteResponse = await client
      .post(`/api/f/${comment.post.forum.name}/posts/${comment.post.slug}/comments/${comment.slug}/downvote`)
      .loginAs(user)
      .form(data)
      .withCsrfToken()
    assert.equal(downvoteResponse.status(), 200)
    assert.equal(downvoteResponse.body().message, 'Comment downvoted')
    await comment.refresh()
    await comment.load('voters')
    const downvote = comment.voters.find((voter) => voter.userId === user.id)
    assert.exists(downvote)
    assert.equal(downvote?.$extras.pivot_score, -1)
  })
})
