import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'profile_blocks'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('blocker_id').unsigned().references('user_id').inTable('profiles').onDelete('CASCADE')
      table.integer('blocked_id').unsigned().references('user_id').inTable('profiles').onDelete('CASCADE')
      table.timestamp('created_at')
      table.primary(['blocker_id', 'blocked_id'])
      table.unique(['blocker_id', 'blocked_id'])
      table.index(['blocker_id', 'blocked_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
