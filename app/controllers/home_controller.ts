import type { HttpContext } from '@adonisjs/core/http'
import Post from '#models/post'
import { sortPostValidator } from '#validators/post'
import filter from '#services/filter_bad_words'
import db from '@adonisjs/lucid/services/db'

export default class HomeController {
  /**
   * @index
   * @summary Home page
   * @tag Home
   */
  async index({ bouncer, request, inertia, auth }: HttpContext) {
    const { sort_by, order } = await request.validateUsing(sortPostValidator)
    const postsQuery = await Post.query()
      .select('id', 'posterId', 'title', 'content', 'forumId', 'slug', 'imageUrl', 'createdAt', 'isRemoved')
      .where('isRemoved', false)
      .preload('poster', (posterQuery) =>
        posterQuery.select('displayName', 'userId').preload('user', (userQuery) => userQuery.select('username')),
      )
      .withCount('comments', (commentsQuery) => commentsQuery.where('isRemoved', false))
      .preload('forum', (forumQuery) =>
        forumQuery
          .select('name', 'iconId', 'isRemoved', 'isDeleted', 'isHidden')
          .preload('icon', (iconQuery) => iconQuery.select('url'))
          .preload('moderators', (moderatorQuery) => moderatorQuery.select('userId')),
      )
      .withCount('voters')
      .orderBy(sort_by || 'createdAt', order || 'desc')
      .paginate(request.input('page', 1), 20)

    const getPosts = async () =>
      await Promise.all(
        postsQuery.map(async (post) => {
          const forum = post.forum
          const creator = post.forum.moderators[0]
          const moderators = post.forum.moderators

          if (
            !(await bouncer.with('ForumPolicy').denies('show', moderators, creator, forum)) &&
            (await bouncer.with('PostPolicy').allows('view', post))
          ) {
            const userVoteScore: number = auth.user
              ? await db
                  .from('post_likes')
                  .select('score')
                  .where('post_id', post.id)
                  .andWhere('profile_id', auth.user.id)
                  .first()
                  .then((vote) => (vote ? vote.score : 0))
                  .catch(() => 0)
              : 0
            return {
              title: filter.clean(post.title),
              content: post.content ? filter.clean(post.content) : null,
              imageUrl: post.imageUrl,
              slug: post.slug,
              displayName: post.poster.displayName,
              username: post.poster.user.username,
              forumName: post.forum.name,
              avatarUrl: post.forum.icon.url,
              createdAt: post.createdAt.toString(),
              totalComments: post.$extras.comments_count,
              totalScore: post.$extras.voters_count,
              userVoteScore: userVoteScore,
            }
          }
          return null
        }),
      ).then((posts) => posts.filter((post) => post !== null))
    return inertia.render('home', {
      posts: inertia.defer(getPosts).merge(),
      paginate: postsQuery.getMeta(),
    })
  }
}
