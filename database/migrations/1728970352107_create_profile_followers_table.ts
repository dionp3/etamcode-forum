import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'profile_followers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()

      table.integer('follower_id').unsigned().references('user_id').inTable('profiles').onDelete('CASCADE')
      table.integer('following_id').unsigned().references('user_id').inTable('profiles').onDelete('CASCADE')
      table.primary(['following_id', 'follower_id'])
      table.unique(['following_id', 'follower_id'])
      table.index(['following_id', 'follower_id'])

      table.timestamp('created_at')
      table.boolean('is_pending').notNullable().defaultTo(false)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
