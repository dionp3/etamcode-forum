<script lang="ts" setup>
import { router, usePage } from '@inertiajs/vue3'
import { computed } from 'vue'
import { BadgePlus } from 'lucide-vue-next'
import type { User } from '~/types'
import { Link } from '@inertiajs/vue3'

const page = usePage<{ isAuth: boolean; user: User }>()
const isAuth = computed(() => page.props.isAuth)
//const user = computed(() => page.props.user)
</script>

<template>
  <div v-if="isAuth" class="flex items-center space-x-4">
    <!-- Search Button (visible only on small screens) -->

    <!-- Authenticated User Actions -->
    <!-- Create Post Button -->
    <Link href="/post" class="btn btn-outline rounded-full btn-primary flex items-center">
      <BadgePlus class="lucide" />
      <span>Create</span>
    </Link>

    <!-- User Dropdown -->
    <div class="dropdown dropdown-end">
      <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
        <div class="w-12 rounded-full">
          <img
            alt="profile picture"
            src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
          />
        </div>
      </div>
      <ul tabindex="0" class="menu dropdown-content bg-base-300 rounded-box w-64 shadow">
        <li><a class="justify-between">Profile</a></li>
        <li><a>Settings</a></li>
        <li><a @click="router.post('/auth/logout')">Logout</a></li>
      </ul>
    </div>
  </div>
  <!-- Authentication Modal for Non-Authenticated Users -->
  <AuthModal v-else />
</template>

<style lang="postcss" scoped>
.lucide {
  @apply text-primary;
}
</style>
