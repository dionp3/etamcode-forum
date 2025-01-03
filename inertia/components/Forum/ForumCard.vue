<script setup lang="ts">
import { format } from 'date-fns'
import type { Forum } from '~/types'

defineProps<{ forum: Forum }>()
const formatDate = (date: string | Date | null, fallback = 'N/A') =>
  date ? format(new Date(date), 'PPP p') : fallback
</script>

<template>
  <div
    class="card outline outline-1 outline-primary shadow rounded-lg break-inside-avoid mb-5 w-full max-w-full"
  >
    <div class="card-body">
      <!-- TODO: Forum Banner -->
      <!-- <div class="w-full h-48 bg-cover rounded-lg"
        :style="{ backgroundImage: `url(${forum.banner})` }"></div> -->

      <!-- Forum Icon (Placeholder if no icon is available) -->
      <div class="avatar my-4">
        <div class="w-24 rounded-full">
          <img
            :src="
              forum.icon?.url
                ? forum.icon.url
                : `https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp`
            "
            alt="Forum Icon"
          />
        </div>
      </div>

      <!-- Forum Name & Description -->
      <h2 class="card-title text-2xl font-bold">
        {{ forum.name }}
      </h2>
      <p class="text-gray-600 mb-4">{{ forum.description }}</p>

      <!-- Forum Visibility and Status -->
      <p v-if="forum.visibility === 'public'" class="text-green-600">This forum is public.</p>
      <p v-else class="text-yellow-600">This forum is private.</p>
      <p v-if="forum.is_removed" class="text-red-600">This forum has been removed.</p>
      <p v-if="forum.is_deleted" class="text-gray-400">This forum has been deleted.</p>
      <p v-if="forum.is_hidden" class="text-gray-500">This forum is hidden.</p>
      <p v-if="forum.is_posting_restricted_to_mods" class="text-orange-500">
        Only moderators can post in this forum.
      </p>

      <!-- Forum Creation and Last Update Date -->
      <p class="text-gray-500 mt-4">Created: {{ formatDate(forum.createdAt) }}</p>
      <p class="text-gray-500">Last Updated: {{ formatDate(forum.updatedAt) }}</p>
    </div>
  </div>
</template>
