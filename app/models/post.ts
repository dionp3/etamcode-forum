import string from '@adonisjs/core/helpers/string'
import { BaseModel, afterCreate, afterUpdate, belongsTo, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Comment from '#models/comment'
import Flair from '#models/flair'
import Forum from '#models/forum'
import Hashtag from '#models/hashtag'
import Profile from '#models/profile'

type SerializedComment = {
  id: number
  slug: string
  content: string
  createdAt: string
  displayName: string
  username: string
  avatarUrl: string
  replies: SerializedComment[]
}

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

  @belongsTo(() => Forum, { foreignKey: 'forumId' })
  declare forum: BelongsTo<typeof Forum>

  @column()
  declare flairId: number | null

  @belongsTo(() => Flair)
  declare flair: BelongsTo<typeof Flair>

  @hasMany(() => Comment)
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
  declare slug: string

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

  @manyToMany(() => Profile, {
    pivotTable: 'post_hides',
    localKey: 'id',
    pivotForeignKey: 'post_id',
    relatedKey: 'userId',
    pivotRelatedForeignKey: 'user_id',
    pivotTimestamps: true,
  })
  declare HiddenBy: ManyToMany<typeof Profile>

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
    if (!post.content) return
    const hashtags = post.content.split(' ').filter((word) => word.startsWith('#'))
    await post.related('hasHashtags').detach()
    hashtags.map(async (tag) => {
      const hashtag = await Hashtag.firstOrCreate({ tag }, { tag })
      await post.related('hasHashtags').attach([hashtag.id])
    })
  }

  // New method to retrieve comments and build the comment tree
  async getComments(): Promise<SerializedComment[]> {
    const post = this as Post
    const comments: Comment[] = await post
      .related('comments')
      .query()
      .where('isDeleted', false)
      .orderBy('createdAt', 'desc')
      .preload('creator', (creatorQuery) =>
        creatorQuery
          .select('userId', 'avatarId', 'displayName')
          .preload('user', (userQuery) => userQuery.select('username'))
          .preload('avatar', (avatarQuery) => avatarQuery.select('url')),
      )

    return Post.buildCommentTree(comments)
  }

  // Comment tree building logic moved here from the Comment model
  private static buildCommentTree(comments: Comment[]): SerializedComment[] {
    const commentMap: Map<number, SerializedComment> = new Map()
    const roots: SerializedComment[] = []

    for (const comment of comments) {
      commentMap.set(comment.id, {
        id: comment.id,
        slug: comment.slug,
        content: comment.content,
        createdAt: comment.createdAt.toString(),
        displayName: comment.creator.displayName || comment.creator.user.username,
        username: comment.creator.user.username,
        avatarUrl: comment.creator.avatar.url,
        replies: [],
      } as SerializedComment)
    }

    for (const comment of comments) {
      const serializedComment = commentMap.get(comment.id)
      if (!serializedComment) continue
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
