import type { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class UserSubscription extends BaseModel {
  @column({ isPrimary: true })
  declare id_subscription: number

  @column()
  declare user_id: number

  @column()
  declare plan_id: number

  @column()
  declare start_date: Date

  @column()
  declare end_date: Date | null

  @column()
  declare is_active: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
