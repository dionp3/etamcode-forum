<script setup lang="ts">
import { ref } from 'vue'
import { format } from 'date-fns'
import axios from 'axios'
import { router } from '@inertiajs/vue3'
import type { Forum } from '~/types'
import { Head } from '@inertiajs/vue3'
import type Flair from '#models/flair'

const {
  forum,
  flairs,
  isFollowed: initialFollowedState,
  userCanEdit,
} = defineProps<{ forum: Forum; flairs: Flair[]; isFollowed: boolean; userCanEdit: boolean }>()

const isFollowed = ref(initialFollowedState) // Track if the user is following the forum

// Function to format date
const formatDate = (date: string | Date | null, fallback = 'N/A') => (date ? format(new Date(date), 'PPP p') : fallback)

// Handle Follow/Unfollow logic
const toggleFollow = async () => {
  try {
    if (isFollowed.value) {
      // Unfollow
      await axios.post(`/f/${forum.name}/unfollow`, { forumTargetId: forum.id })
      isFollowed.value = false
    } else {
      // Follow
      await axios.post(`/f/${forum.name}/follow`, { forumTargetId: forum.id })
      isFollowed.value = true
    }
  } catch (error) {
    console.error('Error following/unfollowing the forum:', error)
  }
}

// Navigate to the Edit Forum page
const goToEditPage = () => {
  router.get(`/f/${forum.name}/edit`)
}

// Navigate to the Edit Flairs page
const goToEditFlairsPage = () => {
  router.get(`/f/${forum.name}/flairs`)
}
</script>

<template>

  <Head :title="forum.name" />
  <div class="card outline outline-1 outline-primary shadow rounded-lg break-inside-avoid mb-5 w-full max-w-full">
    <div class="card-body">
      <div class="w-full h-48 bg-cover rounded-lg"
        :style="{ backgroundImage: `url(https://ui-avatars.com/api/?name=${forum.name})` }">
      </div>

      <!-- Forum Icon (Placeholder if no icon is available) -->
      <div class="avatar my-4">
        <div class="w-24 rounded-full">
          <img :src="forum.icon?.url
            ? forum.icon.url
            : `https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp`
            " alt="Forum Icon" />
        </div>
      </div>

      <!-- Forum Name & Description -->
      <h2 class="card-title text-2xl font-bold">
        {{ forum.name }}
      </h2>
      <p class="text-base-content mb-4">{{ forum.description }}</p>

      <!-- Forum Visibility and Status -->
      <p v-if="forum.visibility === 'public'" class="text-green-600">This forum is public.</p>
      <p v-else class="text-yellow-600">This forum is private.</p>
      <p v-if="forum.is_removed" class="text-red-600">This forum has been removed.</p>
      <p v-if="forum.is_deleted" class="text-base-content">This forum has been deleted.</p>
      <p v-if="forum.is_hidden" class="text-base-content">This forum is hidden.</p>
      <p v-if="forum.is_posting_restricted_to_mods" class="text-orange-500">
        Only moderators can post in this forum.
      </p>

      <!-- Forum Creation and Last Update Date -->
      <p class="text-base-content mt-4">Created: {{ formatDate(forum.createdAt) }}</p>
      <p class="text-base-content">Last Updated: {{ formatDate(forum.updatedAt) }}</p>

      <!-- Action Buttons -->
      <div class="flex flex-wrap gap-2 mt-4 mb-4">
        <!-- Follow/Unfollow Button -->
        <button @click="toggleFollow" :class="['btn btn-sm', isFollowed ? 'btn-secondary' : 'btn-primary', 'h-10']">
          {{ isFollowed ? 'Unfollow Forum' : 'Follow Forum' }}
        </button>

        <!-- Edit Forum Button -->
        <button v-if="userCanEdit" @click="goToEditPage" class="btn btn-outline btn-sm h-10 text-center">
          Edit Forum
        </button>

        <!-- Edit Flairs Button -->
        <button v-if="userCanEdit" @click="goToEditFlairsPage" class="btn btn-outline btn-sm h-10 text-center">
          Edit Flairs
        </button>
      </div>

      <!-- Forum Flairs -->
      <ForumFlairs :flairs="flairs" />
    </div>
  </div>
</template>
