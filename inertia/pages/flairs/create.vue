<script lang="ts" setup>
import { useForm, router } from '@inertiajs/vue3'
import { toRaw } from 'vue'
import { ArrowLeft } from 'lucide-vue-next'
// Props passed from the backend
const { forum } = defineProps<{
  forum: { id: number; name: string }
}>()

const rawForum = toRaw(forum)

// Inertia form initialization
const form = useForm({
  forumId: rawForum.id,
  name: '',
  color: '#000000',
})

// Submit handler
const submit = () => {
  form.post(`/f/${rawForum.name}/flairs`)
}
function goBack() {
  if (window.history.length > 1) {
    window.history.back()
  } else {
    router.visit('/')
  }
}
</script>

<template>
  <div class="container mx-auto p-6 max-w-md">
    <button @click.prevent="goBack" class="btn btn-ghost btn-sm rounded-full mb-4">
      <ArrowLeft />Back
    </button>
    <!-- Page Header -->
    <header class="mb-6">
      <h1 class="text-2xl font-bold">Add New Flair</h1>
      <p class="text-gray-500">Create a flair for the forum: {{ forum.name }}</p>
    </header>

    <!-- Form -->
    <form @submit.prevent="submit" class="space-y-4">
      <!-- Name Input -->
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700">Flair Name</label>
        <input v-model="form.name" type="text" id="name" name="name" placeholder="Enter flair name"
          class="mt-1 block w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
        <div v-if="form.errors.name" class="text-red-500 text-sm">{{ form.errors.name }}</div>
      </div>

      <!-- Color Input -->
      <div>
        <label for="color" class="block text-sm font-medium text-gray-700">Color</label>
        <input v-model="form.color" type="color" id="color" name="color" class="mt-1 block w-16 h-10" />
        <div v-if="form.errors.color" class="text-red-500 text-sm">{{ form.errors.color }}</div>
      </div>

      <!-- Submit Button -->
      <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition duration-300"
        :disabled="form.processing">
        {{ form.processing ? 'Submitting...' : 'Create Flair' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.container {
  max-width: 500px;
}
</style>
