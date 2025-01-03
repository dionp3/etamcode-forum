import TestSeeder from '#database/seeders/main/test_seeder'
import Post from '#models/post'
import Profile from '#models/profile'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'
import Comment from '#models/comment'

test.group('Comment votes', (g) => {
  g.setup(async () => {
    await db.beginGlobalTransaction()
    const seeder = new TestSeeder(db.connection())
    await seeder.run()
  })

  g.teardown(async () => {
    await db.rollbackGlobalTransaction()
  })
  test('can make upvotes and unvotes', async ({ assert }) => {
    const comment = await Comment.query()
      .where('isRemoved', false)
      .andWhere('isDeleted', false)
      .preload('post')
      .firstOrFail()
    const user = await User.findByOrFail('username', 'authorizeduser')
    await user.load('profile')

    await Profile.upvoteComment(user.profile, comment.post, comment)
    await comment.refresh()
    await comment.load('voters')

    let vote = comment.voters.find((voter) => voter.userId === user.profile.userId)
    assert.exists(vote)
    assert.equal(vote?.$extras.pivot_score, 1)
    assert.equal(vote?.$extras.pivot_post_id, comment.post.id)

    // Second upvote - should remove
    await Profile.upvoteComment(user.profile, comment.post, comment)
    await comment.refresh()
    await comment.load('voters')

    vote = comment.voters.find((voter) => voter.userId === user.profile.userId)
    assert.notExists(vote)
  })

  test('can make downvotes and unvotes', async ({ assert }) => {
    const comment = await Comment.query()
      .where('isRemoved', false)
      .andWhere('isDeleted', false)
      .preload('post')
      .firstOrFail()
    const user = await User.findByOrFail('username', 'authorizeduser')
    await user.load('profile')

    await Profile.downvoteComment(user.profile, comment.post, comment)
    await comment.refresh()
    await comment.load('voters')

    let vote = comment.voters.find((voter) => voter.userId === user.profile.userId)
    assert.exists(vote)
    assert.equal(vote?.$extras.pivot_score, -1)
    assert.equal(vote?.$extras.pivot_post_id, comment.post.id)

    // Second upvote - should remove
    await Profile.downvoteComment(user.profile, comment.post, comment)
    await comment.refresh()
    await comment.load('voters')

    vote = comment.voters.find((voter) => voter.userId === user.profile.userId)
    assert.notExists(vote)
  })

  test('can switch from upvotes to downvotes', async ({ assert }) => {
    const comment = await Comment.query()
      .where('isRemoved', false)
      .andWhere('isDeleted', false)
      .preload('post')
      .firstOrFail()
    const user = await User.findByOrFail('username', 'authorizeduser')
    await user.load('profile')

    await Profile.upvoteComment(user.profile, comment.post, comment)
    await Profile.downvoteComment(user.profile, comment.post, comment)

    await comment.refresh()
    await comment.load('voters')
    const vote = comment.voters.find((voter) => voter.userId === user.profile.userId)
    assert.exists(vote)
    assert.equal(vote?.$extras.pivot_score, -1)
    assert.equal(vote?.$extras.pivot_post_id, comment.post.id)
  })
  test('can switch from downvotes to upvotes', async ({ assert }) => {
    const comment = await Comment.query()
      .where('isRemoved', false)
      .andWhere('isDeleted', false)
      .preload('post')
      .firstOrFail()
    const user = await User.findByOrFail('username', 'authorizeduser')
    await user.load('profile')

    await Profile.downvoteComment(user.profile, comment.post, comment)
    await Profile.upvoteComment(user.profile, comment.post, comment)

    await comment.refresh()
    await comment.load('voters')
    const vote = comment.voters.find((voter) => voter.userId === user.profile.userId)
    assert.exists(vote)
    assert.equal(vote?.$extras.pivot_score, 1)
    assert.equal(vote?.$extras.pivot_post_id, comment.post.id)
  })
})
