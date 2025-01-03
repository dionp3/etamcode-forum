import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'flairs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('forum_id')
        .unsigned()
        .references('id')
        .inTable('forums')
        .notNullable()
        .onDelete('CASCADE')
      table.string('name', 20).notNullable()
      table.string('color', 20).notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
