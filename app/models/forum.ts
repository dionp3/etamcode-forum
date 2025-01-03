import string from '@adonisjs/core/helpers/string'
import { BaseModel, afterCreate, beforeSave, belongsTo, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Avatar from '#models/avatar'
import Flair from '#models/flair'
import Post from '#models/post'
import Profile from '#models/profile'

export default class Forum extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare iconId: number

  @belongsTo(() => Avatar, {
    foreignKey: 'iconId',
  })
  declare icon: BelongsTo<typeof Avatar>

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
    if (forum.iconId) return
    const avatar = await Avatar.create({ url: `https://ui-avatars.com/api/?name=${forum.name}` })
    forum.merge({ iconId: avatar.id }).save()
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
