import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'mod_transfers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('mod_profile')
        .unsigned()
        .notNullable()
        .references('user_id')
        .inTable('profiles')
        .onDelete('CASCADE')
      table
        .integer('other_profile')
        .unsigned()
        .notNullable()
        .references('user_id')
        .inTable('profiles')
        .onDelete('CASCADE')
      table.integer('forum_id').unsigned().notNullable().references('id').inTable('forums').onDelete('CASCADE')

      table.timestamp('transfered_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
