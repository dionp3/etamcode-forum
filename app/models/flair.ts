import type { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import Forum from '#models/forum'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Post from '#models/post'

export default class Flair extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare forumId: number

  @column()
  declare name: string

  @column()
  declare color: string

  @belongsTo(() => Forum, {})
  declare forum: BelongsTo<typeof Forum>

  @hasMany(() => Post)
  declare posts: HasMany<typeof Post>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
