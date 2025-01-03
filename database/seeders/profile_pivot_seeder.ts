import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Profile from '#models/profile'

export default class ProfilePivotSeeder extends BaseSeeder {
  public static environment: string[] = ['development', 'testing']

  async run() {
    // Fetch all profiles
    const profiles = await Profile.all()

    for (const profile of profiles) {
      // Followers Logic
      const totalFollowers = Math.floor(Math.random() * 10) // Random number of followers
      if (totalFollowers > 0) {
        const randomFollowers = profiles.sort(() => 0.5 - Math.random()).slice(0, totalFollowers)

        // Filter already following
        const alreadyFollowing = await profile.related('followers').query()
        const alreadyFollowingIds = alreadyFollowing.map((follower) => follower.userId)
        const newFollowers = randomFollowers.filter(
          (user) => !alreadyFollowingIds.includes(user.userId) && user.userId !== profile.userId,
        )

        // Attach new followers
        await profile.related('followers').attach(newFollowers.map((user) => user.userId))
      }

      // Blocked Profiles Logic
      const totalBlocked = Math.floor(Math.random() * 3) // Random number of blocked profiles
      if (totalBlocked > 0) {
        const randomBlockedProfiles = profiles.sort(() => 0.5 - Math.random()).slice(0, totalBlocked)

        // Filter already blocked and self
        const alreadyBlocked = await profile.related('blockedProfiles').query()
        const alreadyBlockedIds = alreadyBlocked.map((blocked) => blocked.userId)
        const newBlockedProfiles = randomBlockedProfiles.filter(
          (blockedProfile) =>
            !alreadyBlockedIds.includes(blockedProfile.userId) && blockedProfile.userId !== profile.userId,
        )

        // Attach new blocked profiles
        await profile.related('blockedProfiles').attach(newBlockedProfiles.map((profile) => profile.userId))
      }
    }
  }
}
