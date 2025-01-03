import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'comment_saveds'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table
        .integer('comment_id')
        .unsigned()
        .references('id')
        .inTable('comments')
        .onDelete('CASCADE')
      table
        .integer('profile_id')
        .unsigned()
        .references('user_id')
        .inTable('profiles')
        .onDelete('CASCADE')
      table.timestamp('created_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
