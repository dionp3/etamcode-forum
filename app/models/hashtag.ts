import { DateTime } from 'luxon'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import { BaseModel, column, afterCreate, afterUpdate, manyToMany } from '@adonisjs/lucid/orm'
import Post from '#models/post'

export default class Hashtag extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tag: string

  @manyToMany(() => Post, {
    pivotTable: 'post_hashtags',
    localKey: 'id',
    pivotForeignKey: 'hashtag_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'post_id',
    pivotTimestamps: {
      createdAt: true,
      updatedAt: false,
    },
  })
  declare hasPosts: ManyToMany<typeof Post>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
