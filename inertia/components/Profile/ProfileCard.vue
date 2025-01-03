<script setup lang="ts">
import type { Profile } from '~/types'

defineProps<{ profile: Profile }>()
</script>
<template>
  <div class="card bg-base-300 shadow-xl p-6 rounded-lg">
    <div class="card-body">
      <!--
          <div v-if="profile.user.avatar"></div>
          <div v-else class="avatar">
            <div class="w-24 rounded-full">
              <img src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" />
            </div>
          </div>

-->
      <h2 class="card-title text-2xl font-bold">
        {{ profile.displayName ? profile.displayName : profile.user.username }}
      </h2>
      <p class="text-gray-500 mb-4">User ID: {{ profile.userId }}</p>

      <p v-if="profile.bio" class="text-gray-600 mb-4">{{ profile.bio }}</p>
      <p v-if="profile.isBanned" class="text-red-600">banned</p>
      <p v-if="profile.isDeleted" class="text-gray-400">removed</p>

      <!-- Account Creation Date -->
      <p class="text-gray-500 mt-4">Account Created: {{ profile.createdAt }}</p>
      <p class="text-gray-500">Last Updated: {{ profile.updatedAt }}</p>
    </div>
  </div>
</template>
