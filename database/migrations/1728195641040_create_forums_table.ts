import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'forums'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unique().notNullable()
      table.integer('icon_id').references('id').inTable('avatars').nullable()
      table.string('name', 200).unique().notNullable()
      table.text('description').notNullable()
      table.boolean('is_removed').defaultTo(false).notNullable()
      table.boolean('is_deleted').defaultTo(false).notNullable()
      table.boolean('is_hidden').defaultTo(false).notNullable()
      table.boolean('is_posting_restricted').defaultTo(false).notNullable()
      table.enum('visibility', ['public', 'private', 'restricted']).defaultTo('public').notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
