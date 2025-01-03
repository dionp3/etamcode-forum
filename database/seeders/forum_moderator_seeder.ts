import Forum from '#models/forum'
import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class ForumModeratorSeeder extends BaseSeeder {
  public static environment: string[] = ['development', 'testing']
  async run() {
    // Fetch all forums and users
    const forums = await Forum.all()
    const users = await User.query().where('isAdmin', false).limit(20)

    // Make sure we have data to work with
    if (forums.length === 0 || users.length === 0) {
      console.warn('No forums or users found. Please seed them first.')
      return
    }

    // Populate the forum_moderators table
    for (const forum of forums) {
      const numberOfMods = Math.floor(Math.random() * 4) // 0, 1, 2, or 3

      if (numberOfMods > 0) {
        // Select random users as moderators
        const randomUsers = users
          .sort(() => 0.5 - Math.random()) // Shuffle the users array
          .slice(0, numberOfMods) // Pick the first 'numberOfMods' users

        // Attach the selected users as moderators for the current forum
        await forum.related('moderators').attach(randomUsers.map((user) => user.id))
      }
    }
  }
}
