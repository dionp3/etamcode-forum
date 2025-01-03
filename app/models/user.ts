import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { afterSave, BaseModel, column, hasOne } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import Profile from '#models/profile'
import type { HasOne } from '@adonisjs/lucid/types/relations'
const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email', 'username'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @hasOne(() => Profile)
  declare profile: HasOne<typeof Profile>

  @column()
  declare firebaseId: string | null
  @column()
  declare username: string

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare isAdmin: boolean

  @column()
  declare isVerified: boolean | false

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @afterSave()
  static async createProfile(user: User) {
    const existingProfile = await user.related('profile').query().first()
    if (!existingProfile) {
      await user.related('profile').create({ userId: user.id })
    }
  }
}
