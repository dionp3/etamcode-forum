import TestSeeder from '#database/seeders/main/test_seeder'
import Forum from '#models/forum'
import Profile from '#models/profile'
import User from '#models/user'
import Comment from '#models/comment'
import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'

test.group('Forum followers', (group) => {
  group.setup(async () => {
    await db.beginGlobalTransaction()
    const seeder = new TestSeeder(db.connection())
    await seeder.run()
  })

  group.teardown(async () => {
    await db.rollbackGlobalTransaction()
  })
  test('Can attach user to report post', async ({ assert }) => {
    const user = await User.query().where('username', 'authorizeduser').preload('profile').firstOrFail()

    const forum = await Forum.query()
      .where('isRemoved', false)
      .andWhere('isDeleted', false)
      .andWhere('isHidden', false)
      .andWhere('isPostingRestricted', false)
      .andWhere('visibility', 'public')
      .has('posts')
      .preload('posts', (post) =>
        post.where('isRemoved', false).andWhere('isLocked', false).has('comments').preload('comments'),
      )
      .firstOrFail()

    console.log(forum)

    const post = forum.posts[0]

    console.log(post)

    const comment = post.comments[0]

    console.log(post)

    await Profile.reportComment(user.profile, comment, 'bad comment')
    const report = await Profile.query().where('userId', user.id).preload('reportedComments').firstOrFail()
    const reportComment = report.reportedComments

    assert.equal(reportComment[0].id, comment.id)
    assert.isNotNull(reportComment)
  })
})
