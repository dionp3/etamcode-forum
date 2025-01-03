import { DateTime } from 'luxon'
import {
  afterCreate,
  afterSave,
  BaseModel,
  belongsTo,
  column,
  hasMany,
  manyToMany,
} from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Post from '#models/post'
import Forum from '#models/forum'
import Avatar from '#models/avatar'
import Comment from '#models/comment'
import DefaultAvatar from '#models/default_avatar'
export default class Profile extends BaseModel {
  @column({ isPrimary: true, columnName: 'user_id' })
  declare userId: number

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @column()
  declare avatarId: number | null

  @belongsTo(() => Avatar, {
    foreignKey: 'avatarId',
  })
  declare avatar: BelongsTo<typeof Avatar>

  @column({ columnName: 'default_avatar_id' })
  declare defaultAvatarId: number

  @belongsTo(() => DefaultAvatar, {
    foreignKey: 'defaultAvatarId',
  })
  declare defaultAvatar: BelongsTo<typeof DefaultAvatar>

  @hasMany(() => Post, {
    foreignKey: 'posterId',
    localKey: 'userId',
  })
  declare posts: HasMany<typeof Post>

  @manyToMany(() => Post, {
    pivotTable: 'post_reports',
    localKey: 'userId',
    pivotForeignKey: 'user_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'post_id',
    pivotColumns: ['reason'],
    pivotTimestamps: true,
  })
  declare reportedPosts: ManyToMany<typeof Post>

  @manyToMany(() => Comment, {
    pivotTable: 'comment_reports',
    localKey: 'userId',
    pivotForeignKey: 'user_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'comment_id',
    pivotColumns: ['reason'],
    pivotTimestamps: true,
  })
  declare reportedComments: ManyToMany<typeof Comment>

  @manyToMany(() => Forum, {
    pivotTable: 'forum_moderators',
    localKey: 'userId',
    pivotForeignKey: 'profile_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'forum_id',
    pivotTimestamps: true,
  })
  declare moderatedForums: ManyToMany<typeof Forum>

  @manyToMany(() => Profile, {
    pivotTable: 'profile_followers',
    localKey: 'userId',
    pivotForeignKey: 'follower_id',
    relatedKey: 'userId',
    pivotRelatedForeignKey: 'following_id',
    pivotTimestamps: {
      createdAt: 'created_at',
      updatedAt: false,
    },
    pivotColumns: ['is_pending'],
  })
  declare followings: ManyToMany<typeof Profile>

  @manyToMany(() => Profile, {
    pivotTable: 'profile_followers',
    localKey: 'userId',
    pivotForeignKey: 'following_id',
    relatedKey: 'userId',
    pivotRelatedForeignKey: 'follower_id',
    pivotTimestamps: {
      createdAt: 'created_at',
      updatedAt: false,
    },
    pivotColumns: ['is_pending'],
  })
  declare followers: ManyToMany<typeof Profile>

  @manyToMany(() => Profile, {
    pivotTable: 'profile_blocks',
    localKey: 'userId',
    pivotForeignKey: 'blocker_id',
    relatedKey: 'userId',
    pivotRelatedForeignKey: 'blocked_id',
    pivotTimestamps: {
      createdAt: true,
      updatedAt: false,
    },
  })
  declare blockedProfiles: ManyToMany<typeof Profile>

  @manyToMany(() => Profile, {
    pivotTable: 'profile_blocks',
    localKey: 'userId',
    pivotForeignKey: 'blocked_id',
    relatedKey: 'userId',
    pivotRelatedForeignKey: 'blocker_id',
    pivotTimestamps: {
      createdAt: true,
      updatedAt: false,
    },
  })
  declare profileBlockers: ManyToMany<typeof Profile>

  @manyToMany(() => Forum, {
    pivotTable: 'forum_profile_bans',
    localKey: 'userId',
    pivotForeignKey: 'profile_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'forum_id',
    pivotTimestamps: true,
  })
  declare bannedFromForums: ManyToMany<typeof Forum>

  @manyToMany(() => Forum, {
    pivotTable: 'forum_followers',
    localKey: 'userId',
    pivotForeignKey: 'profile_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'forum_id',
    pivotTimestamps: true,
  })
  declare followedForums: ManyToMany<typeof Forum>

  @manyToMany(() => Forum, {
    pivotTable: 'forum_blocks',
    localKey: 'userId',
    pivotForeignKey: 'profile_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'forum_id',
    pivotTimestamps: true,
  })
  declare blockedForums: ManyToMany<typeof Forum>

  @manyToMany(() => Post, {
    pivotTable: 'post_likes',
    localKey: 'userId',
    pivotForeignKey: 'profile_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'post_id',
    pivotColumns: ['score'],
    pivotTimestamps: {
      createdAt: true,
      updatedAt: false,
    },
  })
  declare likedPosts: ManyToMany<typeof Post>

  @manyToMany(() => Comment, {
    pivotTable: 'comment_likes',
    localKey: 'userId',
    pivotForeignKey: 'profile_id',
    relatedKey: 'id',
    pivotColumns: ['post_id', 'score'],
    pivotTimestamps: {
      createdAt: true,
      updatedAt: false,
    },
  })
  declare likedComments: ManyToMany<typeof Comment>

  @manyToMany(() => Post, {
    pivotTable: 'post_saveds',
    localKey: 'userId',
    pivotForeignKey: 'profile_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'post_id',
    pivotTimestamps: {
      createdAt: true,
      updatedAt: false,
    },
  })
  declare savedPosts: ManyToMany<typeof Post>

  @manyToMany(() => Comment, {
    pivotTable: 'comment_saveds',
    localKey: 'userId',
    pivotForeignKey: 'profile_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'comment_id',
    pivotTimestamps: {
      createdAt: true,
      updatedAt: false,
    },
  })
  declare savedComments: ManyToMany<typeof Comment>

  @column()
  declare displayName: string | null

  @column()
  declare bio: string | null

  @column()
  declare isBanned: boolean

  @column()
  declare isDeleted: boolean

  @column()
  declare banExpiresAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @afterCreate()
  static async assignAvatar(profile: Profile) {
    const randomAvatar = await DefaultAvatar.query().orderByRaw('RANDOM()').first()
    if (randomAvatar) {
      await profile.merge({ defaultAvatarId: randomAvatar.id }).save()
    }
  }

  static async followProfile(profile: Profile, targetProfile: Profile): Promise<void> {
    await profile.related('followings').attach([targetProfile.userId])
  }

  static async unfollowProfile(profile: Profile, targetProfile: Profile): Promise<void> {
    await profile.related('followings').detach([targetProfile.userId])
  }

  static async blockProfile(profile: Profile, targetProfile: Profile): Promise<void> {
    await profile.related('blockedProfiles').attach([targetProfile.userId])
  }

  static async unblockProfile(profile: Profile, targetProfile: Profile): Promise<void> {
    await profile.related('blockedProfiles').detach([targetProfile.userId])
  }

  static async followForum(profile: Profile, forumTarget: Forum): Promise<void> {
    await profile.related('followedForums').attach([forumTarget.id])
  }

  static async unfollowForum(profile: Profile, forumTarget: Forum): Promise<void> {
    await profile.related('followedForums').detach([forumTarget.id])
  }

  static async blockForum(profile: Profile, forumTarget: Forum): Promise<void> {
    await profile.related('blockedForums').attach([forumTarget.id])
  }

  static async unblockForum(profile: Profile, forumTarget: Forum): Promise<void> {
    await profile.related('blockedForums').detach([forumTarget.id])
  }

  static async savePost(profile: Profile, post: Post): Promise<void> {
    await profile.related('savedPosts').attach([post.id])
  }

  static async unsavePost(profile: Profile, post: Post): Promise<void> {
    await profile.related('savedPosts').detach([post.id])
  }

  static async saveComment(profile: Profile, comment: Comment): Promise<void> {
    await profile.related('savedComments').attach([comment.id])
  }

  static async unsaveComment(profile: Profile, comment: Comment): Promise<void> {
    await profile.related('savedComments').detach([comment.id])
  }

  static async upvotePost(profile: Profile, post: Post): Promise<void> {
    const existingVote = await profile
      .related('likedPosts')
      .query()
      .where('post_id', post.id)
      .first()

    if (existingVote) {
      // If there's an existing upvote, remove it
      if (existingVote.$extras.pivot_score === 1) {
        await profile.related('likedPosts').detach([post.id])
      }
      // If there's an existing downvote, change it to upvote
      else {
        await profile.related('likedPosts').sync({
          [post.id]: { score: 1 },
        })
      }
    } else {
      // No existing vote, create new upvote
      await profile.related('likedPosts').attach({
        [post.id]: { score: 1 },
      })
    }
  }

  static async downvotePost(profile: Profile, post: Post): Promise<void> {
    const existingVote = await profile
      .related('likedPosts')
      .query()
      .where('post_id', post.id)
      .first()

    if (existingVote) {
      // If there's an existing downvote, remove it
      if (existingVote.$extras.pivot_score === -1) {
        await profile.related('likedPosts').detach([post.id])
      }
      // If there's an existing upvote, change it to downvote
      else {
        await profile.related('likedPosts').sync({
          [post.id]: { score: -1 },
        })
      }
    } else {
      // No existing vote, create new downvote
      await profile.related('likedPosts').attach({
        [post.id]: { score: -1 },
      })
    }
  }

  static async upvoteComment(voter: Profile, post: Post, targetComment: Comment): Promise<void> {
    const existingVote = await voter
      .related('likedComments')
      .query()
      .where('comment_id', targetComment.id)
      .first()

    if (existingVote) {
      // If there's an existing upvote, remove it
      if (existingVote.$extras.pivot_score === 1) {
        await voter.related('likedComments').detach([targetComment.id, post.id])
      }
      // If there's an existing downvote, change it to upvote
      else {
        await voter.related('likedComments').sync({
          [targetComment.id]: { score: 1 },
        })
      }
    } else {
      // No existing vote, create new upvote
      await voter.related('likedComments').attach({
        [targetComment.id]: { score: 1, post_id: post.id, comment_id: targetComment.id },
      })
    }
  }

  static async downvoteComment(voter: Profile, post: Post, targetComment: Comment): Promise<void> {
    const existingVote = await voter
      .related('likedComments')
      .query()
      .where('comment_id', targetComment.id)
      .first()

    if (existingVote) {
      // If there's an existing downvote, remove it
      if (existingVote.$extras.pivot_score === -1) {
        await voter.related('likedComments').detach([targetComment.id])
      }
      // If there's an existing upvote, change it to downvote
      else {
        await voter.related('likedComments').sync({
          [targetComment.id]: { score: -1 },
        })
      }
    } else {
      // No existing vote, create new downvote
      await voter.related('likedComments').attach({
        [targetComment.id]: { score: -1, post_id: post.id, comment_id: targetComment.id },
      })
    }
  }

  static async reportPost(profile: Profile, postTarget: Post, reason: string): Promise<void> {
    await profile.related('reportedPosts').attach({ [postTarget.id]: { reason } })
  }

  static async reportComment(
    profile: Profile,
    targetComment: Comment,
    reason: string
  ): Promise<void> {
    await profile.related('reportedComments').attach({ [targetComment.id]: { reason } })
  }
}
