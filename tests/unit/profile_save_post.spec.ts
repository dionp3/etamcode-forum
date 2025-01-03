import { test } from '@japa/runner'
import Post from '#models/post'
import Profile from '#models/profile'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import TestSeeder from '#database/seeders/main/test_seeder'

test.group('Forum followers', (group) => {
  group.setup(async () => {
    await db.beginGlobalTransaction()
    const seeder = new TestSeeder(db.connection())
    await seeder.run()
  })

  group.teardown(async () => {
    await db.rollbackGlobalTransaction()
  })

  test('can attach profile to saved post', async ({ assert }) => {
    const user = await User.findByOrFail('username', 'authorizeduser')
    await user.load('profile')
    const post = await Post.all()
    await Profile.savePost(user.profile, post[0])
    const savePost = await post[0].related('savedBy').query().where('profile_id', user.id).first()
    assert.isNotNull(savePost)
  })

  test('can detach profile from saved post', async ({ assert }) => {
    const user = await User.findByOrFail('username', 'authorizeduser')
    await user.load('profile')
    const post = await Post.all()
    await Profile.savePost(user.profile, post[0])
    await Profile.unsavePost(user.profile, post[0])
    const savePost = await post[0].related('savedBy').query().where('profile_id', user.id).first()
    assert.isNull(savePost)
  })

  test('can attach profile to saved comment', async ({ assert }) => {
    const user = await User.findByOrFail('username', 'authorizeduser')
    await user.load('profile')
    const post = await Post.all()
    const comment = await post[0].related('comments').query().firstOrFail()
    await Profile.saveComment(user.profile, comment)
    const saveComment = await comment.related('commentSavedBy').query().where('profile_id', user.id).first()
    assert.isNotNull(saveComment)
  })

  test('can detach profile from saved comment', async ({ assert }) => {
    const user = await User.findByOrFail('username', 'authorizeduser')
    await user.load('profile')
    const post = await Post.all()
    const comment = await post[0].related('comments').query().firstOrFail()
    await Profile.saveComment(user.profile, comment)
    await Profile.unsaveComment(user.profile, comment)
    const saveComment = await comment.related('commentSavedBy').query().where('profile_id', user.id).first()
    assert.isNull(saveComment)
  })
})
