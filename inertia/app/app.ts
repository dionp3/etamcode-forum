/// <reference path="../../adonisrc.ts" />
/// <reference path="../../config/ally.ts" />
/// <reference path="../../config/auth.ts" />
/// <reference path="../../config/inertia.ts" />

import '../css/app.css'
import '@catppuccin/highlightjs/css/catppuccin-macchiato.css'
import { createSSRApp, h } from 'vue'
import type { DefineComponent } from 'vue'
import { createInertiaApp, Link } from '@inertiajs/vue3'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import BaseLayout from '~/layouts/BaseLayout.vue'
import AuthLayout from '~/layouts/AuthLayout.vue'

const appName = import.meta.env.VITE_APP_NAME || 'EtamCode Forum'

createInertiaApp({
  progress: { color: '#5468FF' },

  title: (title) => `${title} - ${appName}`,

  resolve: (name) => {
    const page = resolvePageComponent(`../pages/${name}.vue`, import.meta.glob<DefineComponent>('../pages/**/*.vue'))
    page.then((page) => {
      page.default.layout = page.default.layout || (name.startsWith('auth/') ? AuthLayout : BaseLayout)
    })
    return page
  },

  setup({ el, App, props, plugin }) {
    createSSRApp({ render: () => h(App, props) })
      .use(plugin)
      .component('Link', Link)
      .mount(el)
  },
})
