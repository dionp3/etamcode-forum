<script setup>
import { reactive } from 'vue'
import { router, useForm } from '@inertiajs/vue3'
import { ref } from 'vue'
const form = useForm({
  title: null,
  content: null,
  imageUrl: null,
  forumId: null,
  flairId: null,
  hasImage: false,
})
</script>

<template>
  <MainLayout>
    <template #main-content>
      <form @submit.prevent="submit" class="p-6 bg-base-100 rounded-lg shadow-md">
        <h2 class="text-2xl font-bold mb-4">Create a Post</h2>

        <div class="mb-4">
          <label for="title" class="block text-sm font-medium">Title:</label>
          <input id="title" v-model="form.title" class="input input-bordered w-full" />
        </div>

        <label for="imageFile">Upload Image:</label>
        <input id="imageFile" type="file" @change="form.imageUrl = $event.target.files[0]" />

        <div class="mb-4">
          <label for="imageFile" class="block text-sm font-medium">Upload Image:</label>
          <input
            id="imageFile"
            type="file"
            @change="handleFileChange"
            class="file-input file-input-bordered w-full"
          />
        </div>

        <div class="mb-4">
          <label for="forumId" class="block text-sm font-medium">Forum ID:</label>
          <input id="forumId" v-model="form.forumId" class="input input-bordered w-full" />
        </div>

        <div class="mb-4">
          <label for="flairId" class="block text-sm font-medium">Flair ID:</label>
          <input id="flairId" v-model="form.flairId" class="input input-bordered w-full" />
        </div>

        <button type="submit" :disabled="form.processing" class="btn btn-primary w-full">
          Submit
        </button>
      </form>
    </template>
  </MainLayout>
</template>
