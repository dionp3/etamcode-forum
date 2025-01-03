import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'profile_bans'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table
        .integer('profile_id')
        .unsigned()
        .references('user_id')
        .inTable('profiles')
        .onDelete('CASCADE')
        .primary()
      table.timestamp('created_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
