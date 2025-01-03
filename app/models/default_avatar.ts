import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import Forum from '#models/forum'
import type { HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import Profile from './profile.js'

export default class DefaultAvatar extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @hasMany(() => Forum)
  declare forums: HasMany<typeof Forum>

  @hasMany(() => Profile)
  declare profiles: HasMany<typeof Profile>

  @column()
  declare url: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
