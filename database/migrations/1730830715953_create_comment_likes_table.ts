import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'comment_likes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('profile_id').references('user_id').inTable('profiles').unsigned().notNullable().onDelete('CASCADE')
      table.integer('post_id').references('id').inTable('posts').unsigned().notNullable().onDelete('CASCADE')
      table.integer('comment_id').references('id').inTable('comments').unsigned().notNullable().onDelete('CASCADE')
      table.integer('score')
      table.primary(['profile_id', 'post_id', 'comment_id'])
      table.unique(['profile_id', 'post_id', 'comment_id'])
      table.timestamp('created_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
