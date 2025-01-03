import { DateTime } from 'luxon'
import {
  afterCreate,
  afterSave,
  afterUpdate,
  BaseModel,
  beforeSave,
  belongsTo,
  column,
  hasMany,
  manyToMany,
} from '@adonisjs/lucid/orm'
import Post from '#models/post'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Profile from './profile.js'
import string from '@adonisjs/core/helpers/string'

export default class Comment extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare creatorId: number

  @belongsTo(() => Profile, {
    foreignKey: 'creatorId',
  })
  declare creator: BelongsTo<typeof Profile>

  @column()
  declare postId: number

  @belongsTo(() => Post, {
    foreignKey: 'postId',
  })
  declare post: BelongsTo<typeof Post>

  @column({ columnName: 'parent_comment_id' })
  declare parentCommentId: number | null

  @belongsTo(() => Comment, {
    foreignKey: 'parentCommentId',
  })
  declare parentComment: BelongsTo<typeof Comment>

  @hasMany(() => Comment, {
    foreignKey: 'parentCommentId', // The foreign key in the replies (child comments)
    localKey: 'id', // The local key in the parent comment
  })
  declare replies: HasMany<typeof Comment>

  // TODO:
  // - add relations on profile.ts //DONE
  // - configure migrations //DONE
  // - business logic as method
  @manyToMany(() => Profile, {
    pivotTable: 'comment_likes',
    localKey: 'id',
    pivotForeignKey: 'comment_id',
    relatedKey: 'userId',
    pivotRelatedForeignKey: 'profile_id',
    pivotColumns: ['post_id', 'score'],
    pivotTimestamps: {
      createdAt: true,
      updatedAt: false,
    },
  })
  declare voters: ManyToMany<typeof Profile>

  @column()
  declare content: string

  @column()
  declare slug: string | null

  @column()
  declare isRemoved: boolean

  @column()
  declare isRead: boolean

  @column()
  declare isDeleted: boolean

  @manyToMany(() => Profile, {
    pivotTable: 'comment_reports',
    localKey: 'id',
    pivotForeignKey: 'comment_id',
    relatedKey: 'userId',
    pivotRelatedForeignKey: 'user_id',
    pivotColumns: ['reason'],
    pivotTimestamps: true,
  })
  declare reportedBy: ManyToMany<typeof Profile>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @manyToMany(() => Profile, {
    pivotTable: 'comment_saveds',
    localKey: 'id',
    pivotForeignKey: 'comment_id',
    relatedKey: 'userId',
    pivotRelatedForeignKey: 'profile_id',
    pivotTimestamps: {
      createdAt: true,
      updatedAt: false,
    },
  })
  declare commentSavedBy: ManyToMany<typeof Profile>

  @afterCreate()
  @afterUpdate()
  static async slugify(comment: Comment) {
    if (comment.slug) return
    const commentSlug = string.slug(comment.content, {
      replacement: '-',
      lower: true,
      strict: true,
      trim: true,
    })

    const idLen = comment.id.toString().length
    const maxCommentLen = 100 - idLen - 1
    const truncatedSlug = commentSlug.slice(0, maxCommentLen)
    comment.merge({ slug: `${truncatedSlug}.${comment.id}` })
    await comment.save()
  }

  static async getCommentsForPost(postId: number) {
    // const comments = db
    //   .from('comments')
    //   .where('post_id', postId)
    //   .andWhere('is_deleted', false)
    //   .orderBy('created_at', 'asc')
    const comments = await Comment.query()
      .where('postId', postId)
      .andWhere('isDeleted', false)
      .orderBy('createdAt', 'asc')
      .preload('creator', (creatorQuery) => creatorQuery.preload('user')) // Preload the creator of each comment
    // Optionally preload parentComment, if there is show method for comment, or comment/show page
    //.preload('parentComment')

    return Comment.buildCommentTree(comments)
  }

  // TODO: get comment childs in a post

  private static buildCommentTree(comments: Comment[]) {
    const commentMap = new Map<number, any>()
    const roots: any[] = []

    // Initialize the map and add a 'replies' array to each serialized comment
    for (const comment of comments) {
      commentMap.set(comment.id, { ...comment.serialize(), replies: [] })
    }

    // Build the tree by linking child comments to their parent
    for (const comment of comments) {
      const serializedComment = commentMap.get(comment.id)
      if (comment.parentCommentId) {
        const parentComment = commentMap.get(comment.parentCommentId)
        if (parentComment) {
          parentComment.replies.push(serializedComment)
        }
      } else {
        roots.push(serializedComment)
      }
    }

    return roots
  }
  async getDepth(): Promise<number> {
    let depth = 0
    let currentComment: Comment | null = this

    while (currentComment?.parentCommentId) {
      depth++
      currentComment = await Comment.find(currentComment.parentCommentId)
    }

    return depth
  }
}
