import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'profile_aggregates'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table
        .integer('profile_id')
        .unsigned()
        .notNullable()
        .references('user_id')
        .inTable('profiles')
        .onDelete('CASCADE')
        .primary()
      table.bigInteger('post_count').unsigned().defaultTo(0).notNullable()
      table.bigInteger('post_score').unsigned().defaultTo(0).notNullable()
      table.bigInteger('comment_count').unsigned().defaultTo(0).notNullable()
      table.bigInteger('comment_score').unsigned().defaultTo(0).notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
