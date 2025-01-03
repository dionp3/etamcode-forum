<script setup lang="ts">
import { ref } from 'vue'
import { useForm } from '@inertiajs/vue3'
import { ArrowLeft } from 'lucide-vue-next'

// Props for the forum to edit
const { forum } = defineProps<{
  forum: {
    name: string
    description: string
    imageUrl: string | null
    isPostingRestricted: boolean
    visibility: 'public' | 'private'
  }
}>()

// Form setup
const form = useForm({
  name: forum.name,
  description: forum.description,
  imageUrl: forum.imageUrl as File | string | null, // Allow existing URL or File
  isPostingRestricted: forum.isPostingRestricted,
  visibility: forum.visibility,
})

// File input and image preview
const fileInput = ref<HTMLInputElement | null>(null)
const imagePreview = ref<string | null>(forum.imageUrl ?? null)

// File change handler
function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] || null

  if (file) {
    form.imageUrl = file
    const reader = new FileReader()
    reader.onload = () => {
      imagePreview.value = reader.result as string
    }
    reader.readAsDataURL(file)
  }
}

// Trigger file input
function triggerFileInput() {
  fileInput.value?.click()
}

// Remove uploaded image
function removeImage() {
  form.imageUrl = null
  imagePreview.value = null
  if (fileInput.value) fileInput.value.value = ''
}

// Form submission
function submit() {
  form.put(`/f/${forum.name}`, {
    onSuccess: () => {
      form.reset()
      imagePreview.value = null
    },
    onError: (errors) => {
      console.error('Validation errors:', errors)
    },
    forceFormData: true, // Ensures file upload works correctly
  })
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
  <div class="container mx-auto p-4">
    <button @click.prevent="goBack" class="btn btn-ghost btn-sm rounded-full mb-4">
      <ArrowLeft />Back
    </button>
    <h2 class="text-2xl font-bold mb-6">Edit Forum</h2>

    <form @submit.prevent="submit" class="space-y-6">
      <!-- Forum Name -->
      <div class="form-control">
        <label class="label">
          <span class="label-text">Forum Name</span>
        </label>
        <input type="text" placeholder="Enter Forum Name" class="input input-bordered w-full" v-model="form.name"
          required />
        <span v-if="form.errors.name" class="text-red-500 text-sm">{{ form.errors.name }}</span>
      </div>

      <!-- Forum Description -->
      <div class="form-control">
        <label class="label">
          <span class="label-text">Description</span>
        </label>
        <textarea placeholder="Enter Forum Description" class="textarea textarea-bordered w-full"
          v-model="form.description" required></textarea>
        <span v-if="form.errors.description" class="text-red-500 text-sm">{{
          form.errors.description
        }}</span>
      </div>

      <!-- Forum Visibility -->
      <div class="form-control">
        <label class="label">
          <span class="label-text">Visibility</span>
        </label>
        <select v-model="form.visibility" class="select select-bordered w-full" required>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
        <span v-if="form.errors.visibility" class="text-red-500 text-sm">{{
          form.errors.visibility
        }}</span>
      </div>

      <!-- Image Upload -->
      <div class="form-control">
        <label class="label">
          <span class="label-text">Forum Image</span>
        </label>
        <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center"
          @click="triggerFileInput">
          <input type="file" class="hidden" ref="fileInput" @change="handleFileChange" accept="image/*" />
          <div v-if="imagePreview" class="flex flex-col items-center">
            <img :src="imagePreview" alt="Preview" class="w-24 h-24 object-cover mb-2 rounded-lg" />
            <button type="button" class="btn btn-sm btn-error" @click="removeImage">Remove</button>
          </div>
          <div v-else class="text-center">
            <p>
              Drag and drop an image here, or
              <span class="text-primary cursor-pointer">browse</span>
            </p>
          </div>
        </div>
        <span v-if="form.errors.imageUrl" class="text-red-500 text-sm">{{
          form.errors.imageUrl
        }}</span>
      </div>

      <!-- Submit Button -->
      <div class="flex justify-end">
        <button type="submit" class="btn btn-primary" :disabled="form.processing">
          {{ form.processing ? 'Updating...' : 'Update Forum' }}
        </button>
      </div>
    </form>
  </div>
</template>
