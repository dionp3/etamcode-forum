import Forum from '#models/forum'
import Post from '#models/post'
import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class SearchController {
  async searchAll({ request, bouncer, response }: HttpContext) {
    const searchParams = request.input('q')

    const postQuery = await Post.query()
      .select('posterId', 'title', 'content', 'forumId', 'slug', 'imageUrl', 'createdAt')
      .withCount('comments')
      .whereILike('title', `%${searchParams}%`)
      .orWhereILike('content', `%${searchParams}%`)
      .where('isRemoved', false)
      .preload('poster', (posterQuery) =>
        posterQuery.select('displayName', 'userId').preload('user', (userQuery) => userQuery.select('username')),
      )
      .preload('forum', (forumQuery) =>
        forumQuery.select('name', 'iconId').preload('icon', (iconQuery) => iconQuery.select('url')),
      )
      .limit(10)

    const forumQuery = await Forum.query()
      .select('name', 'id', 'iconId')
      .whereLike('name', `%${searchParams}%`)
      .orWhereILike('name', `%${searchParams}%`)
      .preload('icon', (iconQuery) => iconQuery.select('url'))
      .limit(10)

    const userQuery = await User.query()
      .select('username', 'id')
      .whereLike('username', `%${searchParams}%`)
      .orWhereHas('profile', (profileQuery) => profileQuery.whereILike('displayName', `%${searchParams}%`))
      .whereHas('profile', (profileQuery) => profileQuery.where('isBanned', false))
      .preload('profile', (profileQuery) =>
        profileQuery.select('displayName', 'avatarId').preload('avatar', (avatarQuery) => avatarQuery.select('url')),
      )
      .limit(10)

    const authorizedPosts: Post[] = await Promise.all(
      postQuery.map(async (post) => {
        const canView = await bouncer.with('PostPolicy').allows('view', post)
        return canView ? post : null
      }),
    ).then((posts) => posts.filter((post) => post !== null))

    const authorizedForum: Forum[] = await Promise.all(
      forumQuery.map(async (forum) => {
        const moderators = await forum.related('moderators').query().orderBy('pivot_created_at', 'asc')
        const creator = moderators[0]
        const canView = await bouncer.with('ForumPolicy').allows('show', moderators, creator, forum)
        return canView ? forum : null
      }),
    ).then((forums) => forums.filter((forum) => forum !== null))

    return response.json({
      posts: authorizedPosts.map((post) => ({
        title: post.title,
        content: post.content,
        imageUrl: post.imageUrl,
        slug: post.slug,
        displayName: post.poster.displayName,
        username: post.poster.user.username,
        forumName: post.forum.name,
        avatarUrl: post.forum.icon.url,
        createdAt: post.createdAt.toString(),
        totalComments: post.$extras.comments_count,
      })),
      forums: authorizedForum.map((forum) => ({
        name: forum.name,
        iconUrl: forum?.icon?.url,
      })),
      users: userQuery.map((user) => ({
        username: user.username,
        profile: {
          displayName: user.profile.displayName,
          avatarUrl: user.profile.avatar?.url,
        },
      })),
    })
  }

  async searchForum({ request, bouncer, response }: HttpContext) {
    const searchParams = request.input('q')
    const forumQuery = await Forum.query()
      .select('name', 'id', 'iconId')
      .whereLike('name', `%${searchParams}%`)
      .orWhereILike('name', `%${searchParams}%`)
      .preload('icon', (iconQuery) => iconQuery.select('url'))
      .preload('flairs', (flairQuery) => flairQuery.select('name', 'color', 'id'))
      .limit(30)
    const authorizedForum: Forum[] = await Promise.all(
      forumQuery.map(async (forum) => {
        const moderators = await forum.related('moderators').query().orderBy('pivot_created_at', 'asc')
        const creator = moderators[0]
        const canView = await bouncer.with('ForumPolicy').allows('show', moderators, creator, forum)
        return canView ? forum : null
      }),
    ).then((forums) => forums.filter((forum) => forum !== null))
    return response.json(
      authorizedForum.map((forum) => ({
        name: forum.name,
        iconUrl: forum?.icon?.url,
        flairs: forum.flairs.map((flair) => ({
          name: flair.name,
          id: flair.id,
          color: flair.color,
        })),
      })),
    )
  }

  async search(
    //{ request, bouncer, inertia }: HttpContext
  ) {}
}
