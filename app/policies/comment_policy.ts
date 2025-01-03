import User from '#models/user'
import Comment from '#models/comment'
import { allowGuest, BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import Post from '#models/post'

export default class CommentPolicy extends BasePolicy {
  index(user: User) {
    return user.isAdmin
  }

  @allowGuest()
  show(user: User | null, comment: Comment) {
    return (
      !comment.isRemoved || !comment.isDeleted || user?.id === comment.creatorId || user?.isAdmin
    )
  }

  edit(user: User, comment: Comment) {
    return user.id === comment.creatorId || user.isAdmin
  }

  delete(user: User, comment: Comment) {
    return user.id === comment.creatorId || user.isAdmin
  }

  create(user: User | null) {
    if (user) {
      return true
    }
    return false
  }

  report(user: User, comment: Comment): AuthorizerResponse {
    return user.id !== comment.creatorId
  }

  vote(user: User, post: Post, comment: Comment): AuthorizerResponse {
    return !post.isRemoved && !comment.isDeleted && !comment.isRemoved
  }
}
