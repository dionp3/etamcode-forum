<script lang="ts" setup>
// Define props received from the backend
defineProps<{
  forum: { name: string; description?: string }
  flairs: { id: number; name: string; color: string }[]
}>()
import { router } from '@inertiajs/vue3'
import { ArrowLeft } from 'lucide-vue-next'
function goBack() {
  if (window.history.length > 1) {
    window.history.back()
  } else {
    router.visit('/')
  }
}
</script>

<template>
  <div class="container mx-auto p-4">
    <button @click.prevent="goBack" class="btn btn-ghost btn-sm rounded-full mb-4">
      <ArrowLeft />Back
    </button>
    <!-- Forum Header -->
    <header class="mb-6">
      <h1 class="text-2xl font-bold">{{ forum.name }}</h1>
      <p v-if="forum.description" class="text-base-400">{{ forum.description }}</p>
    </header>

    <!-- Flairs List -->
    <section>
      <h2 class="text-xl font-semibold mb-4">Flairs</h2>
      <ul v-if="flairs.length" class="space-y-4">
        <li v-for="flair in flairs" :key="flair.id"
          class="p-22 bg-base-200 border border-primary rounded shadow flex items-center">
          <a :style="{ backgroundColor: flair.color }" class="badge cursor-pointer text-white ml-4">{{ flair.name }}</a>
          <!-- <span class="font-medium">{{ flair.name }}</span> -->
          <Link :href="`/f/${forum.name}/flairs/${flair.id}/edit`"
            class="btn btn-ghost ml-auto text-blue-600 hover:underline">
          Edit
          </Link>
        </li>
      </ul>
      <p v-else class="text-gray-500">No flairs available.</p>
    </section>

    <!-- Add Flair Button -->
    <div class="mt-6">
      <Link :href="`/f/${forum.name}/flairs/create`" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
      Add New Flair
      </Link>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 800px;
}
</style>
