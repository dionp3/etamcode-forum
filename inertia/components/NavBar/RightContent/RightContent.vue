<script lang="ts" setup>
import { usePage } from '@inertiajs/vue3'
import axios from 'axios'
import type { SharedProps } from '@adonisjs/inertia/types'
import { BadgePlus } from 'lucide-vue-next'

const { authUser } = usePage<SharedProps>().props

const handleLogout = async () => {
  try {
    await axios.post('/auth/logout') // Endpoint logout
    window.location.reload() // Refresh page after logout
  } catch (error) {
    console.error('Failed to logout:', error)
    alert('Failed to logout. Please try again.')
  }
}
</script>

<template>
  <div v-if="authUser" class="flex items-center space-x-4">
    <!-- Search Button (visible only on small screens) -->

    <!-- Authenticated User Actions -->
    <!-- Create Post Button -->
    <Link href="/post" class="btn btn-outline rounded-full btn-primary">
    <BadgePlus class="stroke-primary" />
    <span class="hidden  md:inline lg:inline xl:inline 2xl:inline">Create</span>
    </Link>

    <!-- User Dropdown -->
    <div class="dropdown dropdown-end">
      <div tabindex="0" role="button" class="avatar">
        <div class="w-12 rounded-full">
          <img alt="profile picture" :src="authUser?.avatarUrl
            " />
        </div>
      </div>
      <ul tabindex="0" class="menu dropdown-content bg-base-300 rounded-box w-64 shadow">
        <li>
          <Link :href="`/u/${authUser?.username}`" class="justify-between">Profile</Link>
        </li>
        <!-- <li><a>Settings</a></li> -->
        <li><a @click="handleLogout">Logout</a></li>
      </ul>
    </div>
  </div>
  <!-- Authentication Modal for Non-Authenticated Users -->
  <Link v-else class="btn btn-primary rounded-full" href="/auth/login">
  Login
  </Link>
</template>
