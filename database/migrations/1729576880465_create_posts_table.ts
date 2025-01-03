import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'posts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('poster_id').notNullable().references('user_id').inTable('profiles')
      table.integer('forum_id').notNullable().references('id').inTable('forums')
      table.integer('flair_id').nullable().references('id').inTable('flairs').defaultTo(null).onDelete('SET NULL')

      table.string('title', 100).notNullable()
      table.string('slug').nullable()
      table.text('content')
      table.boolean('has_image').defaultTo(false).notNullable()
      table.text('image_url')
      table.boolean('is_removed').defaultTo(false).notNullable()
      table.boolean('is_locked').defaultTo(false).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
