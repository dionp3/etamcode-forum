import { createInertiaApp, Link } from '@inertiajs/vue3'
import { renderToString } from '@vue/server-renderer'
import { createSSRApp, h, type DefineComponent } from 'vue'
import type { Page } from '@inertiajs/core'
import BaseLayout from '~/layouts/BaseLayout.vue'
import AuthLayout from '~/layouts/AuthLayout.vue'

export default function render(page: Page) {
  return createInertiaApp({
    page,
    render: renderToString,
    resolve: (name) => {
      const pages = import.meta.glob<DefineComponent>('../pages/**/*.vue', { eager: true })
      const page = pages[`../pages/${name}.vue`]
      page.default.layout = page.default.layout || (name.startsWith('auth/') ? AuthLayout : BaseLayout)
      return page
    },

    setup({ App, props, plugin }) {
      return createSSRApp({ render: () => h(App, props) })
        .use(plugin)
        .component('Link', Link)
    },
  })
}
