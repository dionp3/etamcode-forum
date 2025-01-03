import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'profiles'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('default_avatar_id')
        .references('id')
        .inTable('default_avatars')
        .onDelete('SET NULL')
      table.integer('avatar_id').references('id').inTable('avatars').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('default_avatar_id')
      table.dropColumn('avatar_id')
    })
  }
}
