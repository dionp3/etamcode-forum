import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'post_reports'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('post_id').unsigned().notNullable().references('id').inTable('posts').onDelete('CASCADE')

      table.integer('user_id').unsigned().notNullable().references('user_id').inTable('profiles').onDelete('CASCADE')

      table.string('reason').notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
