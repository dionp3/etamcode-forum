<script setup lang="ts">
import { ref } from 'vue'
import type ProfilesController from '#controllers/profiles_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { useForm, router } from '@inertiajs/vue3'
import { ArrowLeft } from 'lucide-vue-next'

const { user, profile, avatarUrl } = defineProps<{
  user: InferPageProps<ProfilesController, 'edit'>['user']
  profile: InferPageProps<ProfilesController, 'edit'>['profile']
  avatarUrl?: InferPageProps<ProfilesController, 'edit'>['avatarUrl']
}>()

const form = useForm({
  displayName: profile?.displayName || '',
  bio: profile?.bio || '',
  imageUrl: null as File | null, // Initialize with existing image URL or null
})

// File input and image preview
const fileInput = ref<HTMLInputElement | null>(null)
const imagePreview = ref<string | null>(avatarUrl ?? null) // Set initial preview if there's an existing image

// File change handler
function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] || null

  if (file) {
    form.imageUrl = file // Set form data to the file selected by user
    const reader = new FileReader()
    reader.onload = () => {
      imagePreview.value = reader.result as string // Set image preview
    }
    reader.readAsDataURL(file) // Read the file as a data URL for preview
  }
}

// Trigger file input
function triggerFileInput() {
  fileInput.value?.click() // Trigger click on file input to open file dialog
}

// Remove uploaded image
function removeImage() {
  form.imageUrl = null // Remove image from form
  imagePreview.value = null // Clear image preview
  if (fileInput.value) fileInput.value.value = '' // Reset file input
}

// Form submission
function submit() {
  form.put(`/u/${user.username}`, {
    onSuccess: () => {
      form.reset()
      imagePreview.value = null
    },
    onError: (errors) => {
      console.error('Validation errors:', errors)
    },
    forceFormData: true, // Ensure file upload works correctly
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
  <div class="w-full max-w-screen-lg">
    <button @click.prevent="goBack" class="btn btn-ghost btn-sm rounded-full mb-4">
      <ArrowLeft />Back
    </button>
    <div class="flex flex-col gap-10 border border-primary p-5 rounded-xl">
      <h2 class="font-bold text-xl text-left">Edit Profile</h2>
      <form @submit.prevent="submit">
        <!-- Display Name -->
        <div class="flex flex-col gap-1">
          <h3 class="text-base pb-1">Display Name</h3>
          <input
            v-model="form.displayName"
            id="displayName"
            placeholder="Display Name"
            class="p-5 rounded-lg bg-neutral"
          />
        </div>

        <!-- Bio -->
        <div class="flex flex-col gap-1 mt-6">
          <h3 class="text-base pb-1">Bio</h3>
          <textarea
            v-model="form.bio"
            id="bio"
            placeholder="Tell us a little bit about yourself! (You can use Markdown)"
            class="p-5 rounded-lg bg-neutral"
          ></textarea>
        </div>

        <!-- Avatar Image Upload -->
        <div class="flex flex-col gap-1 mt-6">
          <h3 class="text-base pb-1">Avatar</h3>
          <div
            class="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center"
            @click="triggerFileInput"
          >
            <input
              type="file"
              class="hidden"
              ref="fileInput"
              @change="handleFileChange"
              accept="image/*"
            />
            <!-- Image Preview -->
            <div v-if="imagePreview" class="flex flex-col items-center">
              <img
                :src="imagePreview"
                alt="Preview"
                class="w-24 h-24 object-cover mb-2 rounded-lg"
              />
              <button type="button" class="btn btn-sm btn-error" @click="removeImage">
                Remove
              </button>
            </div>
            <!-- Default Message if No Image -->
            <div v-else class="text-center p-4">
              <p>Click to upload an avatar or drag and drop an image here.</p>
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          class="btn btn-primary sm:w-1/5 md:w-1/5 lg:w-1/5 xl:w-1/5 2xl:w-1/5 mt-6"
          :disabled="form.processing"
        >
          Update Profile
        </button>
      </form>
    </div>
  </div>
</template>
