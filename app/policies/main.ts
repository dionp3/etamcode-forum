/*
|--------------------------------------------------------------------------
| Bouncer policies
|--------------------------------------------------------------------------
|
| You may define a collection of policies inside this file and pre-register
| them when creating a new bouncer instance.
|
| Pre-registered policies and abilities can be referenced as a string by their
| name. Also they are must if want to perform authorization inside Edge
| templates.
|
*/

export const policies = {
  FlairPolicy: () => import('#policies/flair_policy'),
  CommentPolicy: () => import('#policies/comment_policy'),
  ForumPolicy: () => import('#policies/forum_policy'),
  PostPolicy: () => import('#policies/post_policy'),
  ProfilePolicy: () => import('#policies/profile_policy'),
}
