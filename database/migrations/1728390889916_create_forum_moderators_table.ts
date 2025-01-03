import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'forum_moderators'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('forum_id').unsigned().references('id').inTable('forums').onDelete('CASCADE')
      table.integer('profile_id').unsigned().references('user_id').inTable('profiles').onDelete('CASCADE')
      table.timestamp('created_at')
      table.timestamp('updated_at')
      table.primary(['forum_id', 'profile_id'])
      table.unique(['forum_id', 'profile_id'])
      table.index(['forum_id', 'profile_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
