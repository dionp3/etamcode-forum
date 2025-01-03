import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'forum_aggregates'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('forum_id').unsigned().references('id').inTable('forums').onDelete('CASCADE')
      table.bigInteger('subscribers').defaultTo(0).notNullable()
      table.bigInteger('posts').defaultTo(0).notNullable()
      table.bigInteger('comments').defaultTo(0).notNullable()
      table.bigInteger('users_active_day').defaultTo(0).notNullable()
      table.bigInteger('users_active_week').defaultTo(0).notNullable()
      table.bigInteger('users_active_month').defaultTo(0).notNullable()
      table.double('hot_rank', 5).defaultTo(0.00001).notNullable()
      table.timestamp('created_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
