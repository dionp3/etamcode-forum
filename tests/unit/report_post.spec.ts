import TestSeeder from '#database/seeders/main/test_seeder'
import Forum from '#models/forum'
import Profile from '#models/profile'
import User from '#models/user'
import Post from '#models/post'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

test.group('Forum followers', (group) => {
  //   group.setup(async () => {
  //     await db.beginGlobalTransaction()
  //     const seeder = new TestSeeder(db.connection())
  //     await seeder.run()
  //   })

  //   group.teardown(async () => {
  //     await db.rollbackGlobalTransaction()
  //   })
  test('Can attach user to report post', async ({ assert }) => {
    const user = await User.query().where('username', 'authorizeduser').preload('profile').firstOrFail()
    const forum = await Forum.query()
      .where('isRemoved', false)
      .andWhere('isDeleted', false)
      .andWhere('isHidden', false)
      .andWhere('isPostingRestricted', false)
      .andWhere('visibility', 'public')
      .preload('posts', (post) => post.where('isRemoved', false).andWhere('isLocked', false))
      .firstOrFail()

    const post = forum.posts[0]

    await Profile.reportPost(user.profile, post, 'bad post')
    const report = await Profile.query().where('userId', user.id).preload('reportedPosts').firstOrFail()
    const reportPost = report.reportedPosts

    assert.equal(reportPost[0].id, post.id)
    assert.isNotNull(reportPost)
  })
})
