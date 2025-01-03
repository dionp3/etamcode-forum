import { DefaultAvatarFactory } from '#factories/default_avatar_factory'
import Forum from '#models/forum'
import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class ProductionSeeder extends BaseSeeder {
  async run() {
    await DefaultAvatarFactory.createMany(10)

    const admin = await User.firstOrCreate({
      username: 'faizahnaf',
      email: 'fzhnf@gmail.com',
      password: 'bukanadmin123',
      isAdmin: true,
    })
    const forumExample = await Forum.firstOrCreate({
      name: 'ForumExample',
      description: 'Forum Example',
      visibility: 'public',
    })

    const forumMod1 = await User.create({
      username: 'azureee',
      email: 'rioazure@gmail.com',
      password: 'bukanmoderator',
    })

    await admin.load('profile')
    await forumMod1.load('profile')
    await forumExample.related('moderators').attach([admin.id, forumMod1.id])
    const regularUser = await User.create({
      username: 'testuser',
      email: 'testuser@gmail.com',
      password: 'notauser12',
    })

    await admin.profile.merge({ displayName: 'Faiz Ahnaf', bio: "Site's admin" }).save()
    await forumMod1.profile.merge({ displayName: 'Rionando Ronaldo', bio: 'Upcoming rapper in town' }).save()
  }
}
