import type { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  hasMany,
  afterCreate,
  afterUpdate,
  manyToMany,
} from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Profile from '#models/profile'
import Forum from '#models/forum'
import Flair from '#models/flair'
import Comment from '#models/comment'
import string from '@adonisjs/core/helpers/string'
import Hashtag from '#models/hashtag'

export default class Post extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare posterId: number

  @belongsTo(() => Profile, {
    foreignKey: 'posterId',
  })
  declare poster: BelongsTo<typeof Profile>

  @column()
  declare forumId: number | null

  @belongsTo(() => Forum, {
    foreignKey: 'forumId',
  })
  declare forum: BelongsTo<typeof Forum>

  @column()
  declare flairId: number | null

  @belongsTo(() => Flair)
  declare flare: BelongsTo<typeof Flair>

  @hasMany(() => Comment, {})
  declare comments: HasMany<typeof Comment>

  @manyToMany(() => Profile, {
    pivotTable: 'post_likes',
    localKey: 'id',
    pivotForeignKey: 'post_id',
    relatedKey: 'userId',
    pivotRelatedForeignKey: 'profile_id',
    pivotColumns: ['score'],
    pivotTimestamps: {
      createdAt: true,
      updatedAt: false,
    },
  })
  declare voters: ManyToMany<typeof Profile>

  @manyToMany(() => Hashtag, {
    pivotTable: 'post_hashtags',
    localKey: 'id',
    pivotForeignKey: 'post_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'hashtag_id',
    pivotTimestamps: {
      createdAt: true,
      updatedAt: false,
    },
  })
  declare hasHashtags: ManyToMany<typeof Hashtag>

  @column()
  declare title: string

  @column()
  declare slug: string | null

  @column()
  declare content: string | null

  @column()
  declare hasImage: boolean

  @column()
  declare imageUrl: string | null

  @column()
  declare isRemoved: boolean

  @column()
  declare isLocked: boolean

  @manyToMany(() => Profile, {
    pivotTable: 'post_reports',
    localKey: 'id',
    pivotForeignKey: 'post_id',
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
    pivotTable: 'post_saveds',
    localKey: 'id',
    pivotForeignKey: 'post_id',
    relatedKey: 'userId',
    pivotRelatedForeignKey: 'profile_id',
    pivotTimestamps: {
      createdAt: true,
      updatedAt: false,
    },
  })
  declare savedBy: ManyToMany<typeof Profile>

  @afterCreate()
  @afterUpdate()
  static async slugify(post: Post) {
    if (post.slug) return
    const titleSlug = string.slug(post.title, { replacement: '-', lower: true, strict: true })
    post.merge({ slug: `${titleSlug}.${post.id}` })
    await post.save()
  }

  @afterCreate()
  @afterUpdate()
  static async get_hashtag(post: Post) {
    const hashtags = post.content.split(' ').filter((word) => word.startsWith('#'))
    await post.related('hasHashtags').detach()
    hashtags.map(async (tag) => {
      const hashtag = await Hashtag.firstOrCreate({ tag }, { tag })
      await post.related('hasHashtags').attach([hashtag.id])
    })
  }

  // New method to retrieve comments and build the comment tree
  async getComments() {
    const post = this as Post
    const comments = await post
      .related('comments')
      .query()
      .where('isDeleted', false)
      .orderBy('createdAt', 'asc')
      .preload('creator', (creatorQuery) => creatorQuery.preload('user'))

    return Post.buildCommentTree(comments)
  }

  // Comment tree building logic moved here from the Comment model
  private static buildCommentTree(comments: Comment[]) {
    const commentMap = new Map<number, any>()
    const roots: any[] = []

    for (const comment of comments) {
      commentMap.set(comment.id, { ...comment.serialize(), replies: [] })
    }

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
}
