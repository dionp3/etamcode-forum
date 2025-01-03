import TestSeeder from '#database/seeders/main/test_seeder'
import Post from '#models/post'
import Profile from '#models/profile'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

test.group('Post likes', (g) => {
  g.setup(async () => {
    await db.beginGlobalTransaction()
    const seeder = new TestSeeder(db.connection())
    await seeder.run()
  })

  g.teardown(async () => {
    await db.rollbackGlobalTransaction()
  })
  test('can make upvotes and unvotes', async ({ assert }) => {
    const post = await Post.query().where('isRemoved', false).firstOrFail()
    const user = await User.findByOrFail('username', 'authorizeduser')
    await user.load('profile')

    // First upvote - should create
    await Profile.upvotePost(user.profile, post)
    await post.refresh()
    await post.load('voters')

    let vote = post.voters.find((voter) => voter.userId === user.profile.userId)
    assert.exists(vote)
    assert.equal(vote?.$extras.pivot_score, 1)

    // Second upvote - should remove
    await Profile.upvotePost(user.profile, post)
    await post.refresh()
    await post.load('voters')

    vote = post.voters.find((voter) => voter.userId === user.profile.userId)
    assert.notExists(vote)
  })

  test('can make downvotes and unvotes', async ({ assert }) => {
    const post = await Post.query().where('isRemoved', false).firstOrFail()
    const user = await User.findByOrFail('username', 'authorizeduser')
    await user.load('profile')

    // First downvote - should create
    await Profile.downvotePost(user.profile, post)
    await post.refresh()
    await post.load('voters')

    let vote = post.voters.find((voter) => voter.userId === user.profile.userId)
    assert.exists(vote)
    assert.equal(vote?.$extras.pivot_score, -1)

    // Second downvote - should remove
    await Profile.downvotePost(user.profile, post)
    await post.refresh()
    await post.load('voters')

    vote = post.voters.find((voter) => voter.userId === user.profile.userId)
    assert.notExists(vote)
  })

  test('can switch from upvote to downvote', async ({ assert }) => {
    const post = await Post.query().where('isRemoved', false).firstOrFail()
    const user = await User.findByOrFail('username', 'authorizeduser')
    await user.load('profile')

    // First create an upvote
    await Profile.upvotePost(user.profile, post)

    // Then downvote should remove the upvote and create downvote
    await Profile.downvotePost(user.profile, post)

    await post.refresh()
    await post.load('voters')

    const vote = post.voters.find((voter) => voter.userId === user.profile.userId)
    assert.exists(vote)
    assert.equal(vote?.$extras.pivot_score, -1)
  })
})
