<script lang="ts" setup>
import { ref } from 'vue'
import axios from 'axios'

// Define props received from the backend
const { forum, userId } = defineProps<{
  forum: { name: string; description?: string }
  moderators: { id: number; displayName: string | null; user: { username: string } }[]
  userId: number
}>()

// Create a form reference for adding a new moderator
const form = ref({
  targetUsername: '',
})

// Handle adding a new moderator
const addModerator = async () => {
  try {
    await axios.post(`/f/${forum.name}/moderators`, {
      targetUsername: form.value.targetUsername,
    })
    // Optionally, handle success (e.g., update UI or show a message)
    // Reset form after successful submission
    location.reload()
    form.value.targetUsername = ''
  } catch (error) {
    // Handle error
    console.error('Error adding moderator:', error)
    location.reload()
  }
}

// Handle removing a moderator
const removeModerator = async (moderatorId: number) => {
  try {
    await axios.post(`/f/${forum.name}/moderators/remove`, {
      targetUserId: moderatorId,
    })
    window.location.reload()
  } catch (error) {
    console.error('Error removing moderator:', error)
    window.location.reload()
  }
}
</script>

<template>
  <div class="container mx-auto p-4">
    <!-- Forum Header -->
    <header class="mb-6">
      <h1 class="text-2xl font-bold">Moderators for {{ forum.name }}</h1>
      <p v-if="forum.description" class="text-base-400">{{ forum.description }}</p>
    </header>

    <!-- Add Moderator Form -->
    <section class="mb-6">
      <h2 class="text-xl font-semibold mb-4">Add Moderator</h2>
      <form @submit.prevent="addModerator">
        <div class="flex space-x-4">
          <input v-model="form.targetUsername" type="text" placeholder="Username" class="input input-bordered"
            required />
          <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Add Moderator
          </button>
        </div>
      </form>
    </section>

    <!-- Moderators List -->
    <section>
      <h2 class="text-xl font-semibold mb-4">Moderators</h2>
      <ul v-if="moderators.length" class="space-y-4">
        <li v-for="moderator in moderators" :key="moderator.id"
          class="p-4 bg-base-200 border border-primary rounded shadow flex items-center">
          <div class="flex flex-col">
            <span class="font-medium">
              {{ moderator.displayName || moderator.user.username }}
            </span>
          </div>
          <button @click="removeModerator(moderator.id)" :disabled="moderator.id === userId"
            :class="moderator.id === userId ? 'opacity-50 cursor-not-allowed' : ''"
            class="btn btn-ghost ml-auto text-red-600 hover:underline">
            Remove
          </button>
        </li>
      </ul>
      <p v-else class="text-gray-500">No moderators available.</p>
    </section>
  </div>
</template>

<style scoped>
.container {
  max-width: 800px;
}
</style>
