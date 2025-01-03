import Forum from '#models/forum'
import { test } from '@japa/runner'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import TestSeeder from '#database/seeders/main/test_seeder'
import Profile from '#models/profile'
import Post from '#models/post'

test.group('Forum', (group) => {
  group.setup(async () => {
    await db.beginGlobalTransaction()

    const seeder = new TestSeeder(db.connection())
    await seeder.run()
  })

  group.teardown(async () => {
    await db.rollbackGlobalTransaction()
  })

  test('Authenticated user can see list of forums', async ({ assert, client }) => {
    const authenticatedUser = await User.findByOrFail('username', 'authorizeduser')
    const response = await client.get('/api/f').loginAs(authenticatedUser)
    assert.equal(response.status(), 200)
    assert.exists(response.body().forums)
    assert.isNotNull(response.body().forums[0])
    assert.isObject(response.body().forums[0])
  })

  test('Unauthenticated user can see list of forums', async ({ assert, client }) => {
    const response = await client.get('/api/f')
    assert.equal(response.status(), 200)
    assert.exists(response.body().forums)
    assert.isNotNull(response.body().forums[0])
    assert.isObject(response.body().forums[0])
  })

  test('Admin can see restricted forums', async ({ assert, client }) => {
    const admin = await User.findByOrFail('username', 'admin')
    const response = await client.get('/api/f').loginAs(admin)
    const forums: Forum[] = response.body().forums
    const hasRestrictedForums = forums.some((forum) => forum.isRemoved === true)
    assert.equal(response.status(), 200)
    assert.isTrue(hasRestrictedForums)
  })

  test('Reguler user cannot see restricred forums', async ({ assert, client }) => {
    const regularUser = await Profile.query()
      .doesntHave('moderatedForums')
      .preload('user')
      .firstOrFail()
    const response = await client.get('/api/f').loginAs(regularUser.user)
    const forums: Forum[] = response.body().forums
    const hasRestrictedForums = forums.some((forum) => forum.isRemoved === true)
    assert.equal(response.status(), 200)
    assert.isFalse(hasRestrictedForums)
  })

  test('Authenticated and NON authenticated user can see detail of existing forum', async ({
    assert,
    client,
  }) => {
    // Firstly first, find a forum that has posts in it.
    const forum = await Forum.query()
      .has('moderators')
      .andHas('posts', '>', 2)
      .preload('posts')
      .where('isHidden', false)
      .andWhere('isRemoved', false)
      .andWhere('isDeleted', false)
      .andWhere('isHidden', false)
      .firstOrFail()
    const regularUser = await Profile.query()
      .preload('user')
      .doesntHave('moderatedForums')
      .firstOrFail()
    // console.log(forum.isRemoved)
    assert.exists(forum)
    assert.exists(regularUser)
    const regUserResponse = await client.get(`/api/f/${forum.name}`).loginAs(regularUser.user)
    const unauthResponse = await client.get(`/api/f/${forum.name}`)
    // console.log(regUserResponse.body())
    // console.log(unauthResponse.body())
    assert.equal(regUserResponse.status(), 200)
    assert.equal(unauthResponse.status(), 200)
    // assert.equal(regUserResponse.body().forum.isRemoved, false)
    // assert.equal(unauthResponse.body().forum.isRemoved, false)
  })

  test('Authenticated user can create forum', async ({ assert, client }) => {
    const authenticatedUser = await User.findByOrFail('username', 'authorizeduser')
    const data = {
      name: 'ForumOrangKeren',
      description: 'Keren banget kelen geis',
      isPostingRestricted: false,
      imageUrl: null,
    }
    const response = await client
      .post('/api/f')
      .loginAs(authenticatedUser)
      .form(data)
      .withInertia()
      .withCsrfToken()
    const forumId = response.body().data.id
    const forum = await Forum.findByOrFail('id', forumId)
    await forum.load('moderators', (mods) => mods.orderBy('pivot_created_at', 'asc'))
    const moderators = forum.moderators
    assert.equal(response.status(), 201)
    assert.exists(response.body().data)
    assert.equal(forum.id, forumId)
    assert.equal(moderators[0].userId, authenticatedUser.id)
    assert.exists(forum, 'User should added to forum_moderators table')
  })

  test('Unauthenticated user cannot create forum', async ({ assert, client }) => {
    const name = 'AkuBelumLogin'
    const description = 'Tempatnya orang keren berkumpul'
    const isPostingRestricted = false
    const response = await client
      .post('/api/f')
      .form({
        name: name,
        description: description,
        isPostingRestricted: isPostingRestricted,
      })
      .withInertia()
      .withCsrfToken()
    assert.equal(response.status(), 200)
    const nonExistentForum = await Forum.findBy('name', name)
    assert.notExists(nonExistentForum)
    response.assertInertiaComponent('home')
  })

  test('Authenticated user cannot create forum with whitespaces in name', async ({
    assert,
    client,
  }) => {
    const authenticatedUser = await User.findByOrFail('username', 'authorizeduser')
    const name = 'Forum Orang Keren'
    const description = 'Tempatnya orang keren berkumpul'
    const isPostingRestricted = false
    const response = await client
      .post('/api/f')
      .loginAs(authenticatedUser)
      .form({
        name: name,
        description: description,
        isPostingRestricted: isPostingRestricted,
      })
      .withInertia()
      .withCsrfToken()
    assert.equal(response.status(), 422)
    assert.notExists(response.body().data)
  })

  test('User cannot get non existent forum', async ({ assert, client }) => {
    const response = await client.get(`/api/f/kontolodon999`)
    assert.equal(response.status(), 404)
  })

  test('Visit add-moderator page', async ({ assert, client }) => {
    const admin = await User.findByOrFail('username', 'admin')
    const forums = await Forum.all()
    const singleForum = forums[0]
    const response = await client.get(`/api/f/${singleForum.name}/moderators`).loginAs(admin)
    assert.equal(response.status(), 200)
    assert.exists(response.body().forumModerators)
    assert.isNotNull(response.body().forumModerators[0])
  })

  test('Forum creator can add another moderator', async ({ assert, client }) => {
    let forum = await Forum.query().has('moderators').preload('moderators').firstOrFail()
    const creator = forum.moderators[0]
    const moderatorsLength = forum.moderators.length
    await creator.load('user')
    const regularUser = await Profile.query().doesntHave('moderatedForums').firstOrFail()
    const data = { currForumId: forum.id, targetUserId: regularUser.userId }
    const response = await client
      .post(`/api/f/${forum.name}/moderators`)
      .loginAs(creator.user)
      .form(data)
      .withCsrfToken()
      .withInertia()
    let forumModsAfterAddition = await Forum.query()
      .where('id', '=', forum.id)
      .preload('moderators')
      .firstOrFail()
    const moderatorsLenAfterAddition = forumModsAfterAddition.moderators.length
    assert.equal(response.status(), 200)
    assert.notEqual(moderatorsLength, moderatorsLenAfterAddition)
  })

  test('Forum moderator can add another moderator', async ({ assert, client }) => {
    let forum = await Forum.query()
      .has('moderators', '>', 1)
      .preload('moderators', async (mods) => await mods.orderBy('pivot_created_at', 'asc'))
      .firstOrFail()
    const moderator = forum.moderators[1]
    const moderatorsLength = forum.moderators.length
    await moderator.load('user')
    const regularUser = await Profile.query().doesntHave('moderatedForums').firstOrFail()
    const data = { currForumId: forum.id, targetUserId: regularUser.userId }
    const response = await client
      .post(`/api/f/${forum.name}/moderators`)
      .loginAs(moderator.user)
      .form(data)
      .withCsrfToken()
      .withInertia()
    let forumModsAfterAddition = await Forum.query()
      .where('id', '=', forum.id)
      .preload('moderators')
      .firstOrFail()
    const moderatorsLenAfterAddition = forumModsAfterAddition.moderators.length
    assert.equal(response.status(), 200)
    assert.notEqual(moderatorsLength, moderatorsLenAfterAddition)
  })

  test('Forum moderator cannot delete their moderated forum', async ({ assert, client }) => {
    let forum = await Forum.query()
      .has('moderators', '>', 1)
      .preload('moderators', async (mods) => await mods.orderBy('pivot_created_at', 'asc'))
      .firstOrFail()
    const moderator = forum.moderators[1]
    await moderator.load('user')
    const response = await client
      .delete(`/api/f/${forum.name}`)
      .loginAs(moderator.user)
      .withCsrfToken()
    let forumAfterTryDeletion = await Forum.query().where('id', '=', forum.id).firstOrFail()
    assert.equal(response.status(), 403)
    assert.exists(forumAfterTryDeletion)
  })

  test('Forum creator can remove their moderator', async ({ assert, client }) => {
    let forum = await Forum.query()
      .has('moderators', '>', 1)
      .preload('moderators', async (mods) => await mods.orderBy('pivot_created_at', 'asc'))
      .firstOrFail()
    const creator = forum.moderators[0]
    const moderatorsLength = forum.moderators.length
    await creator.load('user')
    const data = { currForumId: forum.id, targetUserId: forum.moderators[1].userId }
    const response = await client
      .post(`/api/f/${forum.name}/moderators/remove`)
      .loginAs(creator.user)
      .form(data)
      .withCsrfToken()
      .withInertia()
    let forumModsAfterAddition = await Forum.query()
      .where('id', '=', forum.id)
      .preload('moderators')
      .firstOrFail()
    const moderatorsLenAfterRemoval = forumModsAfterAddition.moderators.length
    assert.equal(response.status(), 200)
    assert.notEqual(moderatorsLength, moderatorsLenAfterRemoval)
  })

  test('Forum creator can modify forum attributes', async ({ assert, client }) => {
    const data = {
      name: 'ForumnyaCreator',
      description: 'Modified by creator',
      isPostingRestricted: false,
    }
    let forum = await Forum.query()
      .has('moderators', '>', 1)
      .preload('moderators', async (mods) => await mods.orderBy('pivot_created_at', 'asc'))
      .firstOrFail()
    assert.exists(forum)
    const creator = forum.moderators[0]
    await creator.load('user')
    const response = await client
      .put(`/api/f/${forum.name}`)
      .loginAs(creator.user)
      .form(data)
      .withCsrfToken()
    const forumAfterModified = await Forum.query().where('id', '=', forum.id).firstOrFail()
    assert.exists(forumAfterModified)
    assert.equal(response.status(), 200)
    assert.notEqual(forum.name, forumAfterModified.name)
    assert.notEqual(forum.description, forumAfterModified.description)
  })

  test('Forum moderator can modify forum attributes', async ({ assert, client }) => {
    const data = {
      name: 'ForumnameDiubahMods',
      description: 'Modified by moderator',
      isPostingRestricted: false,
    }
    let forum = await Forum.query()
      .has('moderators', '>', 1)
      .preload('moderators', async (mods) => await mods.orderBy('pivot_created_at', 'asc'))
      .firstOrFail()
    assert.exists(forum)
    const moderator = forum.moderators[1]
    await moderator.load('user')
    const response = await client
      .put(`/api/f/${forum.name}`)
      .loginAs(moderator.user)
      .form(data)
      .withCsrfToken()
    const forumAfterModified = await Forum.query().where('id', '=', forum.id).firstOrFail()
    assert.exists(forumAfterModified)
    assert.equal(response.status(), 200)
    assert.notEqual(forum.name, forumAfterModified.name)
    assert.notEqual(forum.description, forumAfterModified.description)
  })

  test('Forum creator cannot remove themselves as moderator', async ({ assert, client }) => {
    let forum = await Forum.query()
      .has('moderators', '>', 1)
      .preload('moderators', async (mods) => await mods.orderBy('pivot_created_at', 'asc'))
      .firstOrFail()
    const creator = forum.moderators[0]
    const moderatorsLength = forum.moderators.length
    await creator.load('user')
    const data = { currForumId: forum.id, targetUserId: creator.userId }
    const response = await client
      .post(`/api/f/${forum.name}/moderators/remove`)
      .loginAs(creator.user)
      .form(data)
      .withCsrfToken()
    let forumModsAfterAddition = await Forum.query()
      .where('id', '=', forum.id)
      .preload('moderators')
      .firstOrFail()
    const moderatorsLenAfterRemoval = forumModsAfterAddition.moderators.length
    assert.equal(response.status(), 403)
    assert.equal(moderatorsLength, moderatorsLenAfterRemoval)
  })

  test('Forum creator can delete their own forum', async ({ assert, client }) => {
    let forum = await Forum.query()
      .has('moderators', '>', 1)
      .preload('moderators', async (mods) => await mods.orderBy('pivot_created_at', 'asc'))
      .firstOrFail()
    const creator = forum.moderators[0]
    await creator.load('user')
    const response = await client
      .delete(`/api/f/${forum.name}`)
      .loginAs(creator.user)
      .withCsrfToken()
    assert.equal(response.status(), 200)
    let forumAfterDeleted = await Forum.query()
      .where('id', '=', forum.id)
      .preload('posts')
      .firstOrFail()
    assert.equal(forumAfterDeleted.isDeleted, true)
    const posts = forumAfterDeleted.posts
    const regularUser = await Profile.query()
      .doesntHave('moderatedForums')
      .preload('user')
      .firstOrFail()
    const visitForum = await client.get(`/api/f/${forum.name}`).loginAs(regularUser.user)
    const post = await Post.create({
      forumId: forum.id,
      title: 'Aku senang membaca',
      content: 'Kamu gimana?',
      posterId: creator.userId,
    })
    assert.equal(visitForum.status(), 403)
    const viewThePost = await client
      .get(`/api/f/${forum.name}/posts/${post.slug}`)
      .loginAs(regularUser.user)
    console.log(viewThePost.body())
  })
})
