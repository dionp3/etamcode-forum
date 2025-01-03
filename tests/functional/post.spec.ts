import { test } from '@japa/runner'
import User from '#models/user'
import TestSeeder from '#database/seeders/main/test_seeder'
import db from '@adonisjs/lucid/services/db'
import Post from '#models/post'
import Forum from '#models/forum'
import Profile from '#models/profile'
import Hashtag from '#models/hashtag'

test.group('Post', (group) => {
  group.setup(async () => {
    await db.beginGlobalTransaction()

    const seeder = new TestSeeder(db.connection())
    await seeder.run()
  })

  group.teardown(async () => {
    await db.rollbackGlobalTransaction()
  })

  test('Authenticated users can see posts in a forum', async ({ client, assert }) => {
    const user = await User.findByOrFail('username', 'authorizeduser')

    const forum = await Forum.query()
      .has('posts', '>', 2)
      .whereHas('posts', (post) => post.where('isRemoved', false))
      .preload('posts')
      .where('is_removed', false)
      .andWhere('is_deleted', false)
      .andWhere('is_hidden', false)
      .firstOrFail()

    const posts = forum.posts
    const doesntHaveRemovedPost = posts.some((post) => post.isRemoved === false)
    assert.equal(doesntHaveRemovedPost, true)
    const response = await client.get(`/api/f/${forum.name}/`).loginAs(user)
    // console.log(response.body().data.posts[0])
    assert.equal(response.status(), 200)
    assert.exists(response.body().forum)
    assert.exists(response.body().posts)
    assert.equal(response.body().forum.id, forum.id)
  })

  test('Guest can see posts in a forum', async ({ client, assert }) => {
    const forum = await Forum.query()
      .has('posts', '>', 2)
      .whereHas('posts', (post) => post.where('isRemoved', true))
      .andWhereHas('posts', (post) => post.where('isRemoved', false))
      .preload('posts')
      .where('is_removed', false)
      .andWhere('is_deleted', false)
      .andWhere('is_hidden', false)
      .firstOrFail()
    const response = await client.get(`/api/f/${forum.name}`)
    assert.equal(response.status(), 200)
    const posts = forum.posts
    const doesntHaveRemovedPost = posts.some((post) => post.isRemoved === false)
    assert.equal(doesntHaveRemovedPost, true)

    assert.isNotEmpty(response.body().posts)
    assert.isNotNull(response.body().forum)
  })

  test('Authorized user can see their non removed posts', async ({ client, assert }) => {
    const post = await Post.query()
      .preload('poster', (poster) => poster.preload('user'))
      .whereHas('forum', (forum) => {
        forum.where('isDeleted', false).andWhere('isRemoved', false).andWhere('isHidden', false)
      })
      .preload('forum')
      .where('isRemoved', false)
      .firstOrFail()
    const response = await client.get(`/api/f/${post.forum.name}/posts/${post.slug}`).loginAs(post.poster.user)
    assert.equal(response.status(), 200)
    assert.isObject(response.body().post)
  })

  test('It returns 403 if non authorized user see a restricted post', async ({ assert, client }) => {
    const posts = await Post.query()
      .where('isRemoved', true)
      .whereHas('forum', (forum) =>
        forum.where('isRemoved', false).andWhere('isDeleted', false).andWhere('isHidden', false),
      )
      .preload('forum')

    const allAreRemoved = posts.every((post) => post.isRemoved === true)
    assert.equal(allAreRemoved, true)
    const response = await client.get(`/api/f/${posts[0].forum.name}/posts/${posts[0].slug}`)
    assert.equal(response.status(), 403)
    assert.equal(response.body().message, 'You cannot see this post')
  })

  test('Authorized user can see detail of their removed post', async ({ client, assert }) => {
    const post = await Post.query()
      .where('isRemoved', true)
      .whereHas('forum', (forum) => {
        forum.where('isRemoved', false).andWhere('isDeleted', false).andWhere('isHidden', false)
      })
      .preload('forum')
      .preload('poster', (poster) => poster.preload('user'))
      .firstOrFail()

    // checks if status 200, the poster has same id as response body, teh response body is object
    const response = await client.get(`/api/f/${post.forum.name}/posts/${post.slug}`).loginAs(post.poster.user)
    assert.equal(response.status(), 200)
    assert.isObject(response.body().post)
    assert.isNotNull(response.body().post)
    assert.equal(response.body().post.posterId, post.posterId)
  })

  test('It returns 403 when user seeing non removed post but the forum is restricted', async ({ client, assert }) => {
    const posts = await Post.query()
      .where('isRemoved', false)
      .whereHas('forum', (forum) =>
        forum.where('isRemoved', true).andWhere('isDeleted', true).andWhere('isHidden', true),
      )
      .preload('forum')

    const allAreNotRemoved = posts.every((post) => post.isRemoved === false)
    assert.equal(allAreNotRemoved, true)
    const response = await client.get(`/api/f/${posts[0].forum.name}/posts/${posts[0].slug}`)
    assert.equal(response.status(), 403)
    assert.equal(response.body().message, 'You cannot see this post because the forum is restricted')
  })

  test("Unauthorized user cannot update other's post", async ({ client, assert }) => {
    const post = await Post.query()
      .where('isRemoved', false)
      .whereHas('forum', (forum) =>
        forum.where('isRemoved', false).andWhere('isDeleted', false).andWhere('isHidden', false),
      )
      .preload('forum')
      .preload('poster', (poster) => poster.preload('user'))
      .firstOrFail()

    const regularUser = await Profile.query().doesntHave('posts').preload('user').firstOrFail()

    const data = { title: 'Nyoba edit dong', content: 'Testing aje bang', forumId: post.forumId }
    const response = await client
      .put(`/api/f/${post.forum.name}/posts/${post.slug}`)
      .loginAs(regularUser.user)
      .form(data)
      .withCsrfToken()
    assert.equal(response.status(), 403)
    assert.equal(response.body().message, 'You are not allowed to edit this post')
  })

  test('Authorized user can update their post', async ({ client, assert }) => {
    const post = await Post.query()
      .where('isRemoved', false)
      .whereHas('forum', (forum) =>
        forum.where('isRemoved', false).andWhere('isDeleted', false).andWhere('isHidden', false),
      )
      .preload('forum')
      .preload('poster', (poster) => poster.preload('user'))
      .firstOrFail()

    const data = { title: 'Nyoba edit dong', content: 'Testing aje bang', forumId: post.forumId }
    const response = await client
      .put(`/api/f/${post.forum.name}/posts/${post.slug}`)
      .loginAs(post.poster.user)
      .form(data)
      .withCsrfToken()
    const updatedPost = await Post.findByOrFail('id', post.id)
    assert.equal(response.status(), 200)
    assert.notEqual(post.title, updatedPost.title)
  })

  test('It returns 403 if authorized user wants to update their post but the forum is restricted', async ({
    client,
    assert,
  }) => {
    const post = await Post.query()
      .where('isRemoved', false)
      .whereHas('forum', (forum) =>
        forum.where('isRemoved', true).andWhere('isDeleted', false).andWhere('isHidden', false),
      )
      .preload('forum')
      .preload('poster', (poster) => poster.preload('user'))
      .firstOrFail()

    const data = { title: 'Nyoba edit dong', content: 'Testing aje bang', forumId: post.forumId }
    const response = await client
      .put(`/api/f/${post.forum.name}/posts/${post.slug}`)
      .loginAs(post.poster.user)
      .form(data)
      .withCsrfToken()
    const updatedPost = await Post.findByOrFail('id', post.id)
    assert.equal(response.status(), 403)
    assert.equal(response.body().message, 'You cannot edit this post because the forum is restricted')
    assert.equal(post.title, updatedPost.title)
  })

  test("Unauthorized user cannot delete other's post", async ({ client, assert }) => {
    const post = await Post.query()
      .where('isRemoved', false)
      .whereHas('forum', (forum) =>
        forum.where('isRemoved', false).andWhere('isDeleted', false).andWhere('isHidden', false),
      )
      .preload('forum')
      .preload('poster', (poster) => poster.preload('user'))
      .firstOrFail()

    const regularUser = await Profile.query().doesntHave('posts').preload('user').firstOrFail()

    const response = await client
      .delete(`/api/f/${post.forum.name}/posts/${post.slug}`)
      .loginAs(regularUser.user)
      .withCsrfToken()
    assert.equal(response.status(), 403)
    assert.equal(response.body().message, 'You are not allowed to delete this post')
  })

  test('Authorized user can delete their post', async ({ client, assert }) => {
    const post = await Post.query()
      .where('isRemoved', false)
      .whereHas('forum', (forum) =>
        forum.where('isRemoved', false).andWhere('isDeleted', false).andWhere('isHidden', false),
      )
      .preload('forum')
      .preload('poster', (poster) => poster.preload('user'))
      .firstOrFail()

    const user = post.poster.user
    const response = await client
      .delete(`/api/f/${post.forum.name}/posts/${post.slug}`)
      .loginAs(post.poster.user)
      .withCsrfToken()
    const deletedPost = await Post.findBy('id', post.id)
    assert.equal(response.status(), 200)
    assert.equal(deletedPost?.isRemoved, true)
  })

  test('Authorized user can report a post', async ({ client, assert }) => {
    const forum = await Forum.query()
      .where('isRemoved', false)
      .andWhere('isDeleted', false)
      .andWhere('isHidden', false)
      .andWhere('isPostingRestricted', false)
      .andWhere('visibility', 'public')
      .has('posts')
      .preload('posts', (post) => post.where('isRemoved', false).andWhere('isLocked', false))
      .firstOrFail()

    const post = forum.posts[0]

    const user = await User.findByOrFail('username', 'authorizeduser')

    const response = await client
      .post(`/api/f/${forum.name}/posts/${post.slug}/report`)
      .loginAs(user)
      .form({ reason: 'i hate this post for personal reason' })
      .withCsrfToken()
      .withInertia()

    const report = await Profile.query().where('userId', user.id).preload('reportedPosts').firstOrFail()
    const reportPost = report.reportedPosts

    assert.equal(response.status(), 200)
    assert.equal(reportPost[0].id, post.id)
  })

  test('Unauthorized user cannot report a post', async ({ client, assert }) => {
    const forum = await Forum.query()
      .where('isRemoved', false)
      .andWhere('isDeleted', false)
      .andWhere('isHidden', false)
      .andWhere('isPostingRestricted', false)
      .andWhere('visibility', 'public')
      .has('posts')
      .preload('posts', (post) => post.where('isRemoved', false).andWhere('isLocked', false))
      .firstOrFail()

    const post = forum.posts[0]
    const user = await User.findByOrFail('username', 'unauthorizeduser')
    const response = await client
      .post(`/api/f/${forum.name}/posts/${post.slug}/report`)
      .form({ reason: 'i hate this post for sonal reason' })
      .withCsrfToken()

    const userProfile = await Profile.findByOrFail('userId', user.id)

    const profile = await Profile.query().where('userId', userProfile.userId).preload('reportedPosts').firstOrFail()

    const report = profile.reportedPosts[0]

    assert.isUndefined(report)
  })

  test('Newly created post could has hashtags in the content and also in pivot table', async ({ client, assert }) => {
    const user = await User.findByOrFail('username', 'authorizeduser')

    const forum = await Forum.query()
      .has('posts', '>', 2)
      .whereHas('posts', (post) => post.where('isRemoved', false))
      .preload('posts')
      .where('is_removed', false)
      .andWhere('is_deleted', false)
      .andWhere('is_hidden', false)
      .firstOrFail()

    const response = await client
      .post(`/api/f/${forum.name}/posts`)
      .loginAs(user)
      .form({
        title: 'new post',
        content: 'this is my life #goth #fyp',
        forumId: forum.id,
        posterId: user.id,
        hasImage: false,
        isRemoved: false,
        isLocked: false,
      })
      .withCsrfToken()

    const tag = await Hashtag.findByOrFail('tag', '#fyp')

    assert.exists(tag)
    assert.equal(response.status(), 200)
  })
})
