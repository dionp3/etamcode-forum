/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

const RegisterController = () => import('#controllers/auth/register_controller')
const LogoutController = () => import('#controllers/auth/logout_controller')
const LoginController = () => import('#controllers/auth/login_controller')
const ProfilesController = () => import('#controllers/profiles_controller')
const ProfilesControllerApi = () => import('#controllers/api/profiles_controller')
const PostsController = () => import('#controllers/posts_controller')
const PostsControllerApi = () => import('#controllers/api/posts_controller')
const ForumsController = () => import('#controllers/forums_controller')
const ForumsControllerApi = () => import('#controllers/api/forums_controller')
const OauthLoginController = () => import('#controllers/auth/oauth_login_controller')
const CommentsController = () => import('#controllers/comments_controller')
const CommentsControllerApi = () => import('#controllers/api/comments_controller')
const FlairsController = () => import('#controllers/flairs_controller')
const FlairsControllerApi = () => import('#controllers/api/flairs_controller')
const LoginControllerApi = () => import('#controllers/api/login_controller')
const RegisterControllerApi = () => import('#controllers/api/register_controller')
const HomeController = () => import('#controllers/home_controller')
const SearchController = () => import('#controllers/api/search_controller')

import AutoSwagger from 'adonis-autoswagger'
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
import swagger from '#config/swagger'

router.get('/swagger', async () => {
  return AutoSwagger.default.docs(router.toJSON(), swagger)
})

router.get('/docs', async () => {
  return AutoSwagger.default.ui('/swagger', swagger)
})
/**
 * Admin routes
 */
router
  .group(() => {
    router.get('/profiles', [ProfilesController, 'index']).as('profiles.index')
    router.get('/comments', [CommentsController, 'index']).as('comments.index')
  })
  .prefix('/admin')
  .as('admin')
  .use(middleware.auth())

/**
 * Home routes
 */
router.get('/', [HomeController, 'index']).as('home.index').use(middleware.silent())

/**
 * Authentication routes
 */
router
  .group(() => {
    router
      .get('/register', [RegisterController, 'show'])
      .as('register.show')
      .use(middleware.guest())
    router
      .post('/register', [RegisterController, 'store'])
      .as('register.store')
      .use(middleware.guest())

    router.get('/login', [LoginController, 'show']).as('login.show').use(middleware.guest())
    router.post('/login', [LoginController, 'store']).as('login.store').use(middleware.guest())
    router.post('/logout', [LogoutController, 'handle']).as('logout.handle').use(middleware.auth())

    router.get('/google/redirect', [OauthLoginController, 'redirect']).as('google.redirect')
    router.get('/google/callback', [OauthLoginController, 'callback']).as('google.callback')
  })
  .as('auth')
  .prefix('/auth')

/**
 * Profile routes
 */
router
  .group(() => {
    router.get(':username', [ProfilesController, 'show']).as('show')
    router.get(':username/edit', [ProfilesController, 'edit']).as('edit').use(middleware.auth())
    router.put(':username', [ProfilesController, 'update']).as('update').use(middleware.auth())
    router.delete(':username', [ProfilesController, 'destroy']).as('destroy').use(middleware.auth())
    router
      .post(':username/forum-ban', [ForumsController, 'banProfile'])
      .as('forum-ban')
      .use(middleware.auth())
    router.post(':username/forum-unban', [ForumsController, 'unbanProfile']).as('forum-unban')
    router
      .get(':username/followers', [ProfilesController, 'followProfile'])
      .as('profile.followers')
      .use(middleware.auth())
    router
      .post(':username/follow', [ProfilesController, 'followProfile'])
      .as('profile.follow')
      .use(middleware.auth())
    router
      .post(':username/unfollow', [ProfilesController, 'unfollowProfile'])
      .as('profile.unfollow')
      .use(middleware.auth())
    router
      .get(':username/blocked-profiles', [ProfilesController, 'blockProfile'])
      .as('profile.blocked.profile')
      .use(middleware.auth())
    router
      .post(':username/block', [ProfilesController, 'blockProfile'])
      .as('profile.block')
      .use(middleware.auth())
    router
      .post(':username/unblock', [ProfilesController, 'unblockProfile'])
      .as('profile.unblock')
      .use(middleware.auth())
  })
  .as('profiles')
  .prefix('/u')

/**
 * Forum routes
 */
router
  .resource('f', ForumsController)
  .use(['index', 'show'], middleware.silent())
  .use(['create', 'store', 'update', 'destroy'], middleware.auth())
  .params({ f: 'name' })
router
  .get('f/:name/moderators', [ForumsController, 'addModerator'])
  .use(middleware.auth())
  .as('forums.get.moderators')
router
  .post('f/:name/moderators', [ForumsController, 'addModerator'])
  .use(middleware.auth())
  .as('forums.post.moderators')
router
  .post('f/:name/moderators/remove', [ForumsController, 'removeModerator'])
  .use(middleware.auth())
  .as('forums.remove.moderators')
// TODO: list all followers
router.get('f/:name/followers', async () => {}).as('forums.followers')
// TODO: list all banned users from forum
router.get('f/:name/banned-users', async () => {}).as('forums.banned-user')
router
  .post('f/:name/follow', [ProfilesController, 'followForum'])
  .use(middleware.auth())
  .as('forums.follow')
router
  .post('f/:name/unfollow', [ProfilesController, 'unfollowForum'])
  .use(middleware.auth())
  .as('forums.unfollow')
router
  .post('f/:name/block', [ProfilesController, 'blockForum'])
  .use(middleware.auth())
  .as('forums.block')
router
  .post('f/:name/unblock', [ProfilesController, 'unblockForum'])
  .use(middleware.auth())
  .as('forums.unblock')

/*
 * Flairs routes
 */
router
  .resource('f.flairs', FlairsController)
  .use(['store', 'destroy', 'update'], middleware.auth())
  .except(['edit', 'show'])
  .params({ f: 'name' })

/**
 * Post routes
 */
router.get('post', [PostsController, 'create']).use(middleware.auth())
router.get('posts', [PostsController, 'index']).use(middleware.silent())
router
  .resource('f.posts', PostsController)
  .use(['store', 'edit', 'update', 'destroy'], middleware.auth())
  .use(['show'], middleware.silent())
  .except(['index', 'create'])
  .params({ f: 'name', posts: 'slug' })
router
  .post('f/:name/posts/:post_slug/upvote', [ProfilesController, 'upvotePost'])
  .use(middleware.auth())
  .as('posts.upvote')
router
  .post('f/:name/posts/:post_slug/downvote', [ProfilesController, 'downvotePost'])
  .use(middleware.auth())
  .as('posts.downvote')
router
  .post('f/:name/posts/:post_slug/report', [PostsController, 'reportPost'])
  .use(middleware.auth())
  .as('posts.report')

/**
 * Comment routes
 */
router
  .resource('f.posts.comments', CommentsController)
  .use(['store', 'update', 'destroy'], middleware.auth())
  // Show method will be used later
  .except(['index', 'create', 'show', 'edit'])
  .params({ f: 'name', posts: 'post_slug', comments: 'slug' })
router
  .post('f/:name/posts/:post_slug/comments/:comment_slug/upvote', [
    ProfilesController,
    'upvoteComment',
  ])
  .use(middleware.auth())
  .as('comments.upvote')
router
  .post('f/:name/posts/:post_slug/comments/:comment_slug/downvote', [
    ProfilesController,
    'downvoteComment',
  ])
  .use(middleware.auth())
  .as('comments.downvote')

/*
 * Search API intended for XHR request using Axios
 */
router
  .group(() => {
    router.get('posts', [SearchController, 'postIndex'])
    router.get('forums', [SearchController, 'forumIndex'])
    router.get('users', [SearchController, 'userIndex'])
  })
  .prefix('/search')

/**
 * API endpoints for all resources (testing purposes)
 */
router
  .group(() => {
    router
      .group(() => {
        router.get(':username', [ProfilesControllerApi, 'show']).as('show')
        router
          .get(':username/edit', [ProfilesControllerApi, 'edit'])
          .as('edit')
          .use(middleware.auth())
        router
          .put(':username', [ProfilesControllerApi, 'update'])
          .as('update')
          .use(middleware.auth())
        router
          .delete(':username', [ProfilesControllerApi, 'destroy'])
          .as('destroy')
          .use(middleware.auth())
        router
          .post(':username/forum-ban', [ForumsControllerApi, 'banProfile'])
          .as('forum-ban')
          .use(middleware.auth())
        router
          .post(':username/forum-unban', [ForumsControllerApi, 'unbanProfile'])
          .as('forum-unban')
        router
          .get(':username/followers', [ProfilesControllerApi, 'followProfile'])
          .as('profile.followers')
          .use(middleware.auth())
        router
          .post(':username/follow', [ProfilesControllerApi, 'followProfile'])
          .as('profile.follow')
          .use(middleware.auth())
        router
          .post(':username/unfollow', [ProfilesControllerApi, 'unfollowProfile'])
          .as('profile.unfollow')
          .use(middleware.auth())
        router
          .get(':username/blocked-profiles', [ProfilesControllerApi, 'blockProfile'])
          .as('profile.blocked.profile')
          .use(middleware.auth())
        router
          .post(':username/block', [ProfilesControllerApi, 'blockProfile'])
          .as('profile.block')
          .use(middleware.auth())
        router
          .post(':username/unblock', [ProfilesControllerApi, 'unblockProfile'])
          .as('profile.unblock')
          .use(middleware.auth())
      })
      .as('profiles')
      .prefix('/u')

    router.post('auth/login', [LoginControllerApi, 'store']).as('api.login').use(middleware.guest())
    router
      .post('auth/register', [RegisterControllerApi, 'store'])
      .as('api.register')
      .use(middleware.guest())
    router
      .get('auth/verify/:token', [RegisterControllerApi, 'verifyEmail'])
      .as('api.verify')
      .use(middleware.guest())
    router
      .resource('f', ForumsControllerApi)
      .use(['index', 'show'], middleware.silent())
      .use(['create', 'store', 'update', 'destroy'], middleware.auth())
      .params({ f: 'name' })
    router
      .get('f/:name/moderators', [ForumsControllerApi, 'addModerator'])
      .use(middleware.auth())
      .as('forums.get.moderators')
    router
      .post('f/:name/moderators', [ForumsControllerApi, 'addModerator'])
      .use(middleware.auth())
      .as('forums.post.moderators')
    router
      .post('f/:name/moderators/remove', [ForumsControllerApi, 'removeModerator'])
      .use(middleware.auth())
      .as('forums.remove.moderators')
    // TODO: list all followers
    router.get('f/:name/followers', async () => {}).as('forums.followers')
    // TODO: list all banned users from forum
    router.get('f/:name/banned-users', async () => {}).as('forums.banned-user')
    router
      .post('f/:name/follow', [ProfilesControllerApi, 'followForum'])
      .use(middleware.auth())
      .as('forums.follow')
    router
      .post('f/:name/unfollow', [ProfilesControllerApi, 'unfollowForum'])
      .use(middleware.auth())
      .as('forums.unfollow')
    router
      .post('f/:name/block', [ProfilesControllerApi, 'blockForum'])
      .use(middleware.auth())
      .as('forums.block')
    router
      .post('f/:name/unblock', [ProfilesControllerApi, 'unblockForum'])
      .use(middleware.auth())
      .as('forums.unblock')
    router
      .resource('f.posts', PostsControllerApi)
      .use(['create', 'store', 'edit', 'update', 'destroy'], middleware.auth())
      .use(['show'], middleware.silent())
      .except(['index'])
      .params({ f: 'name', posts: 'slug' })

    // Path to report a post
    router
      .post('f/:name/posts/:post_slug/report', [PostsControllerApi, 'reportPost'])
      .use(middleware.auth())
      .as('posts.report')

    router
      .post('f/:name/posts/:post_slug/comments/:slug/report', [
        CommentsControllerApi,
        'reportComment',
      ])
      .use(middleware.auth())
      .as('comments.report')

    // Routes for voting/votes
    router
      .post('f/:name/posts/:post_slug/upvote', [ProfilesControllerApi, 'upvotePost'])
      .use(middleware.auth())
      .as('posts.upvote')
    router
      .post('f/:name/posts/:post_slug/downvote', [ProfilesControllerApi, 'downvotePost'])
      .use(middleware.auth())
      .as('posts.downvote')

    router
      .resource('f.posts.comments', CommentsControllerApi)
      .use(['store', 'update', 'destroy'], middleware.auth())
      .except(['index', 'create'])
      .params({ f: 'name', posts: 'post_slug', comments: 'slug' })

    // Routes for voting/votes
    router
      .post('f/:name/posts/:post_slug/comments/:comment_slug/upvote', [
        ProfilesControllerApi,
        'upvoteComment',
      ])
      .use(middleware.auth())
      .as('comments.upvote')
    router
      .post('f/:name/posts/:post_slug/comments/:comment_slug/downvote', [
        ProfilesControllerApi,
        'downvoteComment',
      ])
      .use(middleware.auth())
      .as('comments.downvote')
    router
      .resource('f.flairs', FlairsControllerApi)
      .use(['store', 'destroy', 'update'], middleware.auth())
      .params({ f: 'name' })
  })
  .prefix('/api')
  .as('api')
