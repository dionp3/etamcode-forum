import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { PostFactory } from '#database/factories/post_factory'
import { ForumFactory } from '#database/factories/forum_factory'
import { AvatarFactory } from '#database/factories/avatar_factory'
import { UserFactory } from '#database/factories/user_factory'
import User from '#models/user'
import { DefaultAvatarFactory } from '#factories/default_avatar_factory'
import { CommentFactory } from '#factories/comment_factory'
import Comment from '#models/comment'
import { FlairFactory } from '#factories/flair_factory'
import Flair from '#models/flair'
import Post from '#models/post'
import { FirestoreService } from '#services/firestore_service'

export default class StarterSeeder extends BaseSeeder {
  public static environment: string[] = ['development', 'testing']
  async run() {
    const firestoreService = new FirestoreService()
    await firestoreService.deleteAllUser()

    // Create 10 avatars
    // await AvatarFactory.createMany(10)
    await DefaultAvatarFactory.createMany(10)

    const forums = await ForumFactory.createMany(100)

    // // Create 20 users
    const users = await UserFactory.createMany(200)
    users.forEach(
      async (user) =>
        await firestoreService.createUser({
          username: user.username,
          email: user.email,
          password: user.password,
        })
    )

    // Create flairs that attached to random forums
    const flairs = await Promise.all(
      forums.map(
        async (forum) =>
          await FlairFactory.merge({ forumId: forum.id }).createMany(Math.floor(Math.random() * 4))
      )
    )

    // // Load profiles for all users
    await Promise.all(users.map((user) => user.load('profile')))

    // // Create a super admin user
    const admin = await User.firstOrCreate({
      username: 'admin',
      email: 'admin@site.com',
      password: 'admin123',
      isAdmin: true,
    })

    const authorizedUser = await User.firstOrCreate({
      username: 'authorizeduser',
      email: 'authorized@gmail.com',
      password: 'password',
      isAdmin: false,
    })

    const unauthorizedUser = await User.firstOrCreate({
      username: 'unauthorizeduser',
      email: 'unauthorizeduser@gmail.com',
      password: 'password',
      isAdmin: false,
    })

    await firestoreService.createUser({
      email: admin.email,
      username: admin.username,
      password: admin.password,
    })

    await firestoreService.createUser({
      email: admin.email,
      username: admin.username,
      password: admin.password,
    })

    await firestoreService.createUser({
      email: admin.email,
      username: admin.username,
      password: admin.password,
    })

    // Load and update the admin profile
    await authorizedUser.load('profile')
    await unauthorizedUser.load('profile')
    await admin.load('profile')

    await authorizedUser.profile
      .merge({ bio: "I'm an authorized user.", displayName: 'Authorized User' })
      .save()

    await unauthorizedUser.profile
      .merge({ bio: "I'm an unauthorized user.", displayName: 'Unauthorized User' })
      .save()

    await admin.profile.merge({ bio: "I'm an admin.", displayName: 'Admin' }).save()

    const posts = []
    for (const forum of forums) {
      const randomUser = users[Math.floor(Math.random() * users.length)] // Randomly select a user
      const randomFlairs = flairs[forum.id] || []
      const numberOfPosts = Math.floor(Math.random() * 10)
      const flairId =
        Math.random() > 0.5 && randomFlairs.length > 0
          ? randomFlairs[Math.floor(Math.random() * randomFlairs.length)].id
          : null
      const post = await PostFactory.merge({
        posterId: randomUser.id,
        forumId: forum.id,
        flairId: flairId,
      }).createMany(numberOfPosts)
      posts.push(...post)
    }

    for (const post of posts) {
      const topLevelComments = await Promise.all(
        Array.from({ length: Math.floor(Math.random() * 5) + 1 }, async () => {
          const randomUser = users[Math.floor(Math.random() * users.length)]
          return CommentFactory.merge({
            postId: post.id,
            creatorId: randomUser.id,
            parentCommentId: null,
          }).create()
        })
      )

      // Create 0 to 5 replies for each top-level comment
      for (const topLevelComment of topLevelComments) {
        await this.createReplies(topLevelComment, users, 0, 2) // Max depth of 2 for simplicity
      }
    }
  }

  private async createReplies(
    parentComment: any,
    users: User[],
    currentDepth: number,
    maxDepth: number
  ) {
    if (currentDepth >= maxDepth) return

    const replyCount = Math.floor(Math.random() * 4) // 0 to 5 replies

    for (let i = 0; i < replyCount; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)]
      const reply = await CommentFactory.merge({
        postId: parentComment.postId,
        creatorId: randomUser.id,
        parentCommentId: parentComment.id,
      }).create()

      // Recursively create replies to this comment
      await this.createReplies(reply, users, currentDepth + 1, maxDepth)
    }
  }
}
