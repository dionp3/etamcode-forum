import TestSeeder from '#database/seeders/main/test_seeder'
import Forum from '#models/forum'
import User from '#models/user'
import Post from '#models/post'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

test.group('Forum followers', (group) => {
  group.setup(async () => {
    await db.beginGlobalTransaction()
    const seeder = new TestSeeder(db.connection())
    await seeder.run()
  })

  group.teardown(async () => {
    await db.rollbackGlobalTransaction()
  })
  test('Can attach hashtag', async ({ assert }) => {
    const user = await User.query()
      .where('username', 'authorizeduser')
      .preload('profile')
      .firstOrFail()
    const forum = await Forum.query()
      .where('isRemoved', false)
      .andWhere('isDeleted', false)
      .andWhere('isHidden', false)
      .andWhere('isPostingRestricted', false)
      .andWhere('visibility', 'public')
      .has('posts')
      .preload('posts', (post) =>
        post.where('isRemoved', false).andWhere('isLocked', false).has('comments')
      )
      .firstOrFail()

    // const post = forum.posts[0]

    const post = await Post.create({
      posterId: user.id,
      forumId: forum.id,
      title: 'Test Title Post',
      content: 'This is new post #new #fyp #mango',
      hasImage: false,
      isLocked: false,
      isRemoved: false,
    })

    const queryPost = await Post.query().where('id', post.id).preload('hasHashtags').firstOrFail()
    const postHashtag = queryPost.hasHashtags[0]

    assert.equal(postHashtag.$extras.pivot_post_id, post.id)
    assert.isNotNull(postHashtag)
  })
})
