import type { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class SubscriptionPlan extends BaseModel {
  @column({ isPrimary: true })
  declare id_plan: number

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare price: number

  @column()
  declare duration_days: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
