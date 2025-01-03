import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'comments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('parent_comment_id').nullable().references('id').inTable('comments')
      table.integer('creator_id').unsigned().references('user_id').inTable('profiles').onDelete('CASCADE').notNullable()
      table.integer('post_id').unsigned().references('id').inTable('posts').onDelete('CASCADE').notNullable()
      table.string('content', 500).notNullable()
      // table.ltree('path')
      table.string('slug', 100).nullable()
      table.boolean('is_removed').defaultTo(false).notNullable()
      table.boolean('is_read').defaultTo(false).notNullable()
      table.boolean('is_deleted').defaultTo(false).notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
