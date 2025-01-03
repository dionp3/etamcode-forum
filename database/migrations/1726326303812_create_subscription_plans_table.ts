import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'subscription_plans'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('name', 255).notNullable()
      table.text('description').nullable()
      table.decimal('price', 15, 2).notNullable()
      table.integer('duration_days').unsigned().notNullable()

      table.timestamp('created_at').notNullable
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
