import app from '@adonisjs/core/services/app'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class TestSeeder extends BaseSeeder {
  public static environment: string[] = ['development', 'testing']
  private async seed(Seeder: { default: typeof BaseSeeder }) {
    /**
     * Do not run when not in a environment specified in Seeder
     */
    console.log(Seeder.default.environment)
    if (
      !Seeder.default.environment ||
      (!Seeder.default.environment.includes('development') && app.inDev) ||
      (!Seeder.default.environment.includes('testing') && app.inTest) ||
      (!Seeder.default.environment.includes('production') && app.inProduction)
    ) {
      return
    }

    await new Seeder.default(this.client).run()
  }

  async run() {
    // Write your database queries inside the run method
    await this.seed(await import('#database/seeders/starter_seeder'))
    await this.seed(await import('#database/seeders/forum_moderator_seeder'))
    await this.seed(await import('#database/seeders/profile_pivot_seeder'))
  }
}
