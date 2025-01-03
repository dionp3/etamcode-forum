import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'comment_aggregates'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table
        .integer('comment_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('comments')
        .onDelete('CASCADE')

      table
        .integer('creator_id')
        .notNullable()
        .unsigned()
        .references('user_id')
        .inTable('profiles')
        .onDelete('CASCADE')

      table.bigInteger('score').notNullable().defaultTo(0)
      table.bigInteger('upvotes').notNullable().defaultTo(0)
      table.bigInteger('downvotes').notNullable().defaultTo(0)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.integer('child_count').notNullable().defaultTo(0)
      table.double('hot_rank').notNullable().defaultTo(0.0001)
      table.double('controversy_rank').notNullable().defaultTo(0)

      table.primary(['comment_id', 'creator_id'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}

