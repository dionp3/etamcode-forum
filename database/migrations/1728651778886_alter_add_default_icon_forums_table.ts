import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'forums'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('default_icon_id').references('id').inTable('default_avatars')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('default_icon_id').references('id').inTable('default_avatars')
    })
  }
}
