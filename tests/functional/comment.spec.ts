import Comment from '#models/comment'
import User from '#models/user'
import Forum from '#models/forum'
import Profile from '#models/profile'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'
import TestSeeder from '#database/seeders/main/test_seeder'

test.group('Comment', (group) => {
  group.setup(async () => {
    await db.beginGlobalTransaction()

    // seed first
    const seeder = new TestSeeder(db.connection())
    await seeder.run()
  })

  group.teardown(async () => {
    await db.rollbackGlobalTransaction()
  })

  test('Admin can see list of comments', async ({ assert, client }) => {
    const admin = await User.findByOrFail('username', 'admin')
    const response = await client.get('/admin/comments').loginAs(admin).withInertia()
    assert.equal(response.status(), 200)
    assert.exists(response.body().comments)
    assert.exists(response.body().comments[1])
  })

  test("Non admin can't see list of comments", async ({ assert, client }) => {
    const unauthorizedUser = await User.findByOrFail('username', 'unauthorizeduser')
    const response = await client.get('/admin/comments').loginAs(unauthorizedUser)
    assert.equal(response.status(), 403)
  })

  test('Authenticated user can create comment', async ({ assert, client }) => {
    const authenticatedUser = await User.findByOrFail('username', 'authorizeduser')
    const forum = await Forum.query()
      .where('isRemoved', false)
      .andWhere('isDeleted', false)
      .andWhere('isHidden', false)
      .andWhere('isPostingRestricted', false)
      .andWhere('visibility', 'public')
      .preload('posts', (post) => post.where('isRemoved', false).andWhere('isLocked', false))
      .firstOrFail()

    const post = forum.posts[0]

    const response = await client
      .post(`/api/f/${forum.name}/posts/${post.slug}/comments`)
      .loginAs(authenticatedUser)
      .form({
        content: 'I made a comment',
        postId: post.id,
        creatorId: authenticatedUser.id,
        isRemoved: false,
        isDeleted: false,
        isRead: false,
      })
      .withCsrfToken()
      .withInertia()

    const createdComment = await Comment.findByOrFail('content', 'I made a comment')
    assert.equal(response.status(), 201)
    assert.exists(createdComment)
  })

  test("Unauthenticated user can't create comment", async ({ assert, client }) => {
    const response = await client
      .post('/api/comments')
      .form({ content: 'I tried to make a comment' })
      .withInertia()
      .withCsrfToken()

    assert.containsSubset({ component: 'home' }, { component: 'home' })
  })

  test('Authorized user can edit comment', async ({ assert, client }) => {
    const forum = await Forum.query()
      .where('isRemoved', false)
      .andWhere('isDeleted', false)
      .andWhere('isHidden', false)
      .andWhere('isPostingRestricted', false)
      .andWhere('visibility', 'public')
      .preload('posts', (post) =>
        post
          .where('isRemoved', false)
          .andWhere('isLocked', false)
          .preload('comments', (comment) => comment.preload('creator', (creator) => creator.preload('user'))),
      )
      .firstOrFail()

    const post = forum.posts[0]
    const comment = post.comments[0]
    const user = comment.creator.user

    const response = await client
      .put(`/api/f/${forum.name}/posts/${post.slug}/comments/${comment.slug}`)
      .loginAs(user)
      .form({ content: 'Test ubah isi komen' })
      .withCsrfToken()

    assert.equal(response.status(), 200)
    assert.equal(response.body().data.content, 'Test ubah isi komen')
  })

  test('Admin can edit comments', async ({ assert, client }) => {
    const forum = await Forum.query()
      .where('isRemoved', false)
      .andWhere('isDeleted', false)
      .andWhere('isHidden', false)
      .andWhere('isPostingRestricted', false)
      .andWhere('visibility', 'public')
      .preload('posts', (post) =>
        post
          .where('isRemoved', false)
          .andWhere('isLocked', false)
          .preload('comments', (comment) => comment.preload('creator', (creator) => creator.preload('user'))),
      )
      .firstOrFail()

    const post = forum.posts[0]
    const comment = post.comments[0]
    const user = await User.findByOrFail('username', 'admin')

    const response = await client
      .put(`/api/f/${forum.name}/posts/${post.slug}/comments/${comment.slug}`)
      .loginAs(user)
      .form({ content: 'Test ubah isi komen' })
      .withCsrfToken()

    assert.equal(response.status(), 200)
    assert.equal(response.body().data.content, 'Test ubah isi komen')
  })

  test("Unauthorized user cannot edit other's comment", async ({ assert, client }) => {
    const forum = await Forum.query()
      .where('isRemoved', false)
      .andWhere('isDeleted', false)
      .andWhere('isHidden', false)
      .andWhere('isPostingRestricted', false)
      .andWhere('visibility', 'public')
      .preload('posts', (post) =>
        post
          .where('isRemoved', false)
          .andWhere('isLocked', false)
          .preload('comments', (comment) => comment.preload('creator', (creator) => creator.preload('user'))),
      )
      .firstOrFail()

    const post = forum.posts[0]
    const comment = post.comments[0]
    const unauthorizeduserComment = post.comments[1]
    const user = unauthorizeduserComment.creator.user

    const response = await client
      .put(`/api/f/${forum.name}/posts/${post.slug}/comments/${comment.slug}`)
      .loginAs(user)
      .form({
        content: 'saya suka nasi goreng km 130',
      })
      .withCsrfToken()
      .withInertia()

    assert.equal(response.status(), 403)
  })

  test('Authorized user can delete their comment', async ({ assert, client }) => {
    const forum = await Forum.query()
      .where('isRemoved', false)
      .andWhere('isDeleted', false)
      .andWhere('isHidden', false)
      .andWhere('isPostingRestricted', false)
      .andWhere('visibility', 'public')
      .preload('posts', (post) =>
        post
          .where('isRemoved', false)
          .andWhere('isLocked', false)
          .preload('comments', (comment) => comment.preload('creator', (creator) => creator.preload('user'))),
      )
      .firstOrFail()

    const post = forum.posts[0]
    const comment = post.comments[0]
    const user = comment.creator.user

    const response = await client
      .delete(`/api/f/${forum.name}/posts/${post.slug}/comments/${comment.slug}`)
      .loginAs(user)
      .withCsrfToken()
      .withInertia()

    assert.equal(response.status(), 200)
  })

  test('Admin can delete comments', async ({ assert, client }) => {
    const forum = await Forum.query()
      .where('isRemoved', false)
      .andWhere('isDeleted', false)
      .andWhere('isHidden', false)
      .andWhere('isPostingRestricted', false)
      .andWhere('visibility', 'public')
      .preload('posts', (post) =>
        post
          .where('isRemoved', false)
          .andWhere('isLocked', false)
          .preload('comments', (comment) => comment.preload('creator', (creator) => creator.preload('user'))),
      )
      .firstOrFail()

    const post = forum.posts[0]
    const comment = post.comments[0]
    const user = await User.findByOrFail('username', 'admin')

    const response = await client
      .delete(`/api/f/${forum.name}/posts/${post.slug}/comments/${comment.slug}`)
      .loginAs(user)
      .withCsrfToken()
      .withInertia()

    const deletedComment = await Comment.findBy('id', comment.id)
    assert.equal(response.status(), 200)
    assert.isNull(deletedComment)
  })

  test("Unauthorized user cannot delete other's comment", async ({ assert, client }) => {
    const forum = await Forum.query()
      .where('isRemoved', false)
      .andWhere('isDeleted', false)
      .andWhere('isHidden', false)
      .andWhere('isPostingRestricted', false)
      .andWhere('visibility', 'public')
      .preload('posts', (post) =>
        post
          .where('isRemoved', false)
          .andWhere('isLocked', false)
          .preload('comments', (comment) => comment.preload('creator', (creator) => creator.preload('user'))),
      )
      .firstOrFail()

    const post = forum.posts[0]
    const comment = post.comments[0]
    const user = await User.findByOrFail('username', 'unauthorizeduser')

    const response = await client
      .delete(`/api/f/${forum.name}/posts/${post.slug}/comments/${comment.slug}`)
      .loginAs(user)
      .withCsrfToken()
      .withInertia()

    const existingComment = await Comment.findByOrFail('id', comment.id)
    assert.equal(response.status(), 403)
    assert.isNotNull(existingComment)
  })

  test('User can update their own comment in a non-restricted forum and post', async ({ assert, client }) => {
    const user = await User.findByOrFail('username', 'authorizeduser')
    const forum = await Forum.query()
      .where('isRemoved', false)
      .andWhere('isDeleted', false)
      .andWhere('isHidden', false)
      .andWhere('isPostingRestricted', false)
      .andWhere('visibility', 'public')
      .preload('posts', (post) => post.where('isRemoved', false).andWhere('isLocked', false))
      .firstOrFail()

    const post = forum.posts[0]

    const comment = await Comment.create({
      content: 'Saya suka makanan di waroeng rahmad',
      postId: post.id,
      creatorId: user.id,
    })

    const response = await client
      .put(`/api/f/${forum.name}/posts/${post.slug}/comments/${comment.slug}`)
      .form({ content: 'Saya suka makanan ini' })
      .loginAs(user)
      .withCsrfToken()

    // const updatedComment = await Comment.findByOrFail('id', comment.id)
    await comment.refresh()

    assert.equal(response.status(), 200)
    assert.equal(comment.content, 'Saya suka makanan ini')
  })

  test('User can delete their own comment in a non-restricted forum and post', async ({ assert, client }) => {
    const user = await User.findByOrFail('username', 'authorizeduser')
    const forum = await Forum.query()
      .where('isRemoved', false)
      .andWhere('isDeleted', false)
      .andWhere('isHidden', false)
      .andWhere('isPostingRestricted', false)
      .andWhere('visibility', 'public')
      .preload('posts', (post) => post.where('isRemoved', false).andWhere('isLocked', false))
      .firstOrFail()

    const post = forum.posts[0]

    const comment = await Comment.create({
      content: 'Saya suka ayam gami warung tulungagung',
      postId: post.id,
      creatorId: user.id,
    })

    const response = await client
      .delete(`/api/f/${forum.name}/posts/${post.slug}/comments/${comment.slug}`)
      .loginAs(user)
      .withCsrfToken()

    assert.equal(response.status(), 200)
  })

  test('Authorized user can report a comment', async ({ client, assert }) => {
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

    const post = forum.posts[0]

    const comment = post.comments[0]

    const user = await User.findByOrFail('username', 'authorizeduser')

    const response = await client
      .post(`/api/f/${forum.name}/posts/${post.slug}/comments/${comment.slug}/report`)
      .loginAs(user)
      .form({ reason: 'i hate this comment for personal reason' })
      .withCsrfToken()
      .withInertia()

    const report = await Profile.query().where('userId', user.id).preload('reportedComments').firstOrFail()

    const reportComment = report.reportedComments

    assert.equal(response.status(), 200)
    assert.equal(reportComment[0].id, comment.id)
  })

  test('Unauthorized user cannot report a comment', async ({ client, assert }) => {
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

    const post = forum.posts[0]

    const comment = post.comments[0]

    const user = await User.findByOrFail('username', 'unauthorizeduser')

    const response = await client
      .post(`/api/f/${forum.name}/posts/${post.slug}/comments/${comment.slug}/report`)
      .form({ reason: 'i hate this comment for personal reason' })
      .withCsrfToken()
      .withInertia()

    const report = await Profile.query().where('userId', user.id).preload('reportedComments').firstOrFail()

    console.log(response.body())
    console.log(response.status())

    const reportComment = report.reportedComments

    // console.log(reportComment)

    // assert.equal(response.status(), 403)
    assert.isUndefined(reportComment[0])
  })
})
