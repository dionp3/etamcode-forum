import type User from '#models/user'
import type Post from '#models/post'
import { allowGuest, BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
// import Profile from '#models/profile'

export default class PostPolicy extends BasePolicy {
  @allowGuest()
  view(user: User | null, post: Post): AuthorizerResponse {
    return !post.isRemoved || user?.isAdmin || user?.id === post.posterId
  }

  @allowGuest()
  show(user: User | null, post: Post): AuthorizerResponse {
    return !post.isRemoved || user?.isAdmin || user?.id === post.posterId
  }

  edit(user: User, post: Post): AuthorizerResponse {
    return post.posterId === user.id || user.isAdmin
  }

  delete(user: User, post: Post): AuthorizerResponse {
    return user.id === post.posterId || user.isAdmin
  }

  report(user: User, post: Post): AuthorizerResponse {
    return !!user && user.id !== post.posterId
  }

  vote(user: User, post: Post): boolean {
    return !post.isRemoved
  }
}
