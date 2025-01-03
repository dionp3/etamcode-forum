import { DateTime } from 'luxon'
import Avatar from '#models/avatar'
import {
  afterCreate,
  afterSave,
  BaseModel,
  beforeSave,
  belongsTo,
  column,
  hasMany,
  manyToMany,
} from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasOne, ManyToMany } from '@adonisjs/lucid/types/relations'
import Post from '#models/post'
import DefaultAvatar from '#models/default_avatar'
import Profile from '#models/profile'
import Flair from '#models/flair'
import string from '@adonisjs/core/helpers/string'

export default class Forum extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare iconId: number | null

  @belongsTo(() => Avatar, {
    foreignKey: 'iconId',
  })
  declare icon: BelongsTo<typeof Avatar>

  @column({ columnName: 'default_icon_id' })
  declare defaultIconId: number

  @belongsTo(() => DefaultAvatar, {
    foreignKey: 'defaultIconId',
  })
  declare defaultIcon: BelongsTo<typeof DefaultAvatar>

  @hasMany(() => Post)
  declare posts: HasMany<typeof Post>

  @hasMany(() => Flair)
  declare flairs: HasMany<typeof Flair>

  @manyToMany(() => Profile, {
    pivotTable: 'forum_moderators',
    localKey: 'id',
    pivotForeignKey: 'forum_id',
    relatedKey: 'userId',
    pivotRelatedForeignKey: 'profile_id',
    pivotTimestamps: true,
  })
  declare moderators: ManyToMany<typeof Profile>

  @manyToMany(() => Profile, {
    pivotTable: 'forum_profile_bans',
    localKey: 'id',
    pivotForeignKey: 'forum_id',
    relatedKey: 'userId',
    pivotRelatedForeignKey: 'profile_id',
    pivotTimestamps: true,
  })
  declare bannedProfiles: ManyToMany<typeof Profile>

  @manyToMany(() => Profile, {
    pivotTable: 'forum_followers',
    localKey: 'id',
    pivotForeignKey: 'forum_id',
    relatedKey: 'userId',
    pivotRelatedForeignKey: 'profile_id',
    pivotTimestamps: true,
  })
  declare followers: ManyToMany<typeof Profile>

  @manyToMany(() => Profile, {
    pivotTable: 'forum_blocks',
    localKey: 'id',
    pivotForeignKey: 'forum_id',
    relatedKey: 'userId',
    pivotRelatedForeignKey: 'profile_id',
    pivotTimestamps: true,
  })
  declare blockedByProfile: ManyToMany<typeof Profile>

  @column()
  declare name: string

  @column()
  declare description: string

  @column()
  declare isRemoved: boolean

  @column()
  declare isDeleted: boolean

  @column()
  declare isHidden: boolean

  @column()
  declare isPostingRestricted: boolean

  @column()
  declare visibility: 'public' | 'private' | 'restricted'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @beforeSave()
  static async normalizeName(forum: Forum) {
    const name = forum.name
    const normalizedName = string.slug(name, { replacement: '', remove: undefined, strict: true })
    forum.name = normalizedName
  }

  @afterCreate()
  static async assignIcon(forum: Forum) {
    const randomIcon = await DefaultAvatar.query().orderByRaw('RANDOM()').first()
    if (randomIcon) {
      forum.merge({ defaultIconId: randomIcon.id }).save()
    }
  }

  static async addModerator(forum: Forum, targetProfile: Profile): Promise<void> {
    await forum.related('moderators').attach([targetProfile.userId])
  }

  static async removeModerator(forum: Forum, targetProfile: Profile): Promise<void> {
    await forum.related('moderators').detach([targetProfile.userId])
  }

  static async removeFollower(forum: Forum, targetProfile: Profile): Promise<void> {
    await forum.related('followers').detach([targetProfile.userId])
  }

  static async banProfile(forum: Forum, targetProfile: Profile): Promise<void> {
    await forum.related('bannedProfiles').attach([targetProfile.userId])
  }

  static async unbanProfile(forum: Forum, targetProfile: Profile): Promise<void> {
    await forum.related('bannedProfiles').detach([targetProfile.userId])
  }
}
