import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasOne } from '@adonisjs/lucid/types/relations'
import Forum from '#models/forum'

export default class Avatar extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @hasOne(() => Forum)
  declare forum: HasOne<typeof Forum>

  @column()
  declare url: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
