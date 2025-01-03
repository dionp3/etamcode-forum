<script setup lang="ts">
import { ref } from 'vue'
import { usePage } from '@inertiajs/vue3'
import type { SharedProps } from '@adonisjs/inertia/types'
import type { Profile } from '~/types'
import axios from 'axios'

const { authUser } = usePage<SharedProps>().props

// Define props
const props = defineProps<{ profile: Profile; isFollower: boolean }>()

// Extract the profile prop
const profile = props.profile

const followed = ref(props.isFollower)

// Follow user
const follow = async () => {
  try {
    const response = await axios.post(`/u/${profile.user.username}/follow`, {
      targetUserId: profile.userId,
    })
    if (response.status === 200) {
      followed.value = true
    }
  } catch (error) {
    console.error('Error following user:', error)
  }
}

// Unfollow user
const unfollow = async () => {
  try {
    const response = await axios.post(`/u/${profile.user.username}/unfollow`, {
      targetUserId: profile.userId,
    })
    if (response.status === 200) {
      followed.value = false
    }
  } catch (error) {
    console.error('Error unfollowing user:', error)
  }
}
</script>
<template>
  <div class="card bg-base-300 shadow-xl p-6 rounded-lg">
    <div class="card-body">
      <div class="avatar">
        <div class="w-24 rounded-full">
          <img :src="profile.avatar.url || `https://placehold.co/400`" />
        </div>
      </div>
      <h2 class="card-title text-2xl font-bold">
        {{ profile.displayName ? profile.displayName : profile.user.username }}
      </h2>

      <p v-if="profile.bio" class="text-base-content">{{ profile.bio }}</p>
      <p v-if="profile.isBanned" class="text-red-600">banned</p>
      <p v-if="profile.isDeleted" class="text-base-content">removed</p>

      <!-- Account Creation Date -->
      <p class="text-base-content mt-4">Account Created: {{ profile.createdAt }}</p>
      <p class="text-base-content">Last Updated: {{ profile.updatedAt }}</p>

      <div v-if="authUser.username === profile.user.username" class="mt-4">
        <a :href="`/u/${authUser?.username}/edit`" class="btn btn-primary">Edit Profile</a>
      </div>
      <!-- Follow/Unfollow button -->
      <button
        v-else
        :class="['btn', followed ? 'btn-secondary' : 'btn-primary']"
        @click="followed ? unfollow() : follow()"
      >
        {{ followed ? 'Unfollow' : 'Follow' }}
      </button>
    </div>
  </div>
</template>
