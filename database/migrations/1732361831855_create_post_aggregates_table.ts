import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'post_aggregates'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('post_id').unsigned().notNullable()
      table.integer('creator_id').unsigned().notNullable()
      table.integer('comments').unsigned().notNullable().defaultTo(0)
      table.integer('upvotes').unsigned().notNullable().defaultTo(0)
      table.integer('downvotes').unsigned().notNullable().defaultTo(0)

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.foreign('post_id').references('id').inTable('posts').onDelete('CASCADE')

      table.foreign('creator_id').references('user_id').inTable('profiles').onDelete('CASCADE')

      table.primary(['post_id', 'creator_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
