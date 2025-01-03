import type { HttpContext } from '@adonisjs/core/http'
import Post from '#models/post'
import { sortPostValidator } from '#validators/post'
import type { ModelPaginatorContract } from '@adonisjs/lucid/types/model'
import Forum from '#models/forum'

export default class HomeController {
  /**
   * @index
   * @summary Home page
   * @tag Home
   */
  async index({ bouncer, request, inertia }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('per_page', 20)
    const { sort_by, order } = await request.validateUsing(sortPostValidator)

    const postQuery: ModelPaginatorContract<Post> = await Post.query()
      .preload('poster', (posterQuery) => posterQuery.preload('user'))
      .preload('forum')
      //.withCount('comments', (query) => query.as('total_comments'))
      .orderBy(sort_by || 'poster_id', order || 'asc')
      .paginate(page, perPage)

    const authorizedPosts: (Post | null)[] = (
      await Promise.all(
        postQuery.map(async (post) => {
          const canView = await bouncer.with('PostPolicy').allows('view', post)
          return canView ? post : null
        })
      )
    ).filter(Boolean) // Filter out any `null` or `undefined` values

    return inertia.render('home', {
      course: 'https://course.etamcode.org',
      onlineTest: 'https://test.etamcode.org',
      flowchart: 'https://chart.etamcode.org',
      posts: authorizedPosts,
      paginate: postQuery.getMeta(),
    })
  }
}
