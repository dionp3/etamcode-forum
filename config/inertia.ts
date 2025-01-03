import { defineConfig } from '@adonisjs/inertia'
import type { InferSharedProps } from '@adonisjs/inertia/types'

const inertiaConfig = defineConfig({
  /**
   * Path to the Edge view that will be used as the root view for Inertia responses
   */
  rootView: 'inertia_layout',

  /**
   * Data that should be shared with all rendered pages
   */
  sharedData: {
    errors: (ctx) => ctx.inertia.always(() => ctx.session?.flashMessages.get('errors')),
    authUser: async (ctx) => {
      const user = ctx.auth?.user
      if (!user) {
        return null
      }
      const profile = await user
        .related('profile')
        .query()
        .select('userId', 'displayName', 'avatarId')
        .preload('avatar', (avatarQuery) => avatarQuery.select('url'))
        .preload('followedForums', (forumQuery) =>
          forumQuery
            .select('name', 'iconId')
            .preload('icon', (iconQuery) => iconQuery.select('url'))
            .where('isRemoved', false)
            .limit(20),
        )
        .first()
      return {
        username: user.username,
        displayName: profile?.displayName,
        avatarUrl: profile?.avatar?.url,
        followedForums:
          profile?.followedForums.map((forum) => {
            return { name: forum.name, iconUrl: forum.icon?.url }
          }) || [],
      }
    },
  },

  /**
   * Options for the server-side rendering
   */
  ssr: {
    enabled: true,
    entrypoint: 'inertia/app/ssr.ts',
  },
})

export default inertiaConfig

declare module '@adonisjs/inertia/types' {
  export interface SharedProps extends InferSharedProps<typeof inertiaConfig> {}
}
