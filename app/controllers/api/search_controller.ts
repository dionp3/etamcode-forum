import Forum from '#models/forum'
import Post from '#models/post'
import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'
import type { ModelPaginatorContract } from '@adonisjs/lucid/types/model'

export default class SearchController {
  /**
   * @postIndex
   * @summary Search posts
   * @tag Search
   */
  async postIndex({ request, bouncer, response }: HttpContext) {
    //TODO: buat setiap method http yang query posts, ditambahin logic untuk menghilangkan postingan yg isRemoved = true jika user bukan moderator / admin
    const searchParams = request.input('query') // Check if a 'query' parameter exists

    if (!searchParams) {
      return response.json({ posts: [] }) // Return an empty posts array
    }

    const postQuery: ModelPaginatorContract<Post> = await Post.query()
      .whereRaw('LOWER(title) LIKE ?', [`%${searchParams.toLowerCase()}%`])
      .orWhereRaw('LOWER(content) LIKE ?', [`%${searchParams.toLowerCase()}%`])
      .paginate(1, 20) // Example: search in 'content' as well

    //const postQuery = await Post.query()
    const authorizedPosts: (Post | null)[] = (
      await Promise.all(
        postQuery.map(async (post) => {
          const canView = await bouncer.with('PostPolicy').allows('view', post as Post)
          return canView ? post : null
        })
      )
    ).filter(Boolean) // Filter out any `null` or `undefined` values

    return response.json({
      posts: authorizedPosts,
    })
  }

  /**
   * @forumIndex
   * @summary Search forums
   * @tag Search
   */
  async forumIndex({ request, response }: HttpContext) {
    const searchParams = request.input('query') // Check if a 'query' parameter exists

    if (!searchParams) {
      return response.json({ forums: [] }) // Return an empty posts array
    }

    const forumQuery: Forum[] = await Forum.query().whereRaw('LOWER(name) LIKE ?', [
      `%${searchParams.toLowerCase()}%`,
    ])

    return response.json({
      forums: forumQuery,
    })
  }

  /**
   * @userIndex
   * @summary Search users
   * @tag Search
   */
  async userIndex({ request, response }: HttpContext) {
    const searchParams = request.input('query') // Check if a 'query' parameter exists

    if (!searchParams) {
      return response.json({ users: [] }) // Return an empty posts array
    }

    const userQuery: User[] = await User.query().whereRaw('LOWER(username) LIKE ?', [
      `%${searchParams.toLowerCase()}%`,
    ])

    return response.json({
      users: userQuery,
    })
  }
}
