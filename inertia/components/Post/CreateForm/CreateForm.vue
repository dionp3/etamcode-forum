<script setup>
import { router, useForm } from '@inertiajs/vue3'
import DropFile from './DropFile.vue'

const form = useForm({
  title: null,
  content: null,
  imageUrl: null,
  forumId: null,
  flairId: null,
})
</script>

<template>
  <form @submit.prevent="form.post('/posts')" class="space-y-4">
    <label class="input input-bordered flex items-center gap-2">
      Title:
      <input id="title" type="text" v-model="form.title" class="grow" placeholder="Enter title" />
    </label>

    <label class="flex flex-col gap-2">
      Content:
      <textarea
        id="content"
        v-model="form.content"
        class="textarea textarea-bordered w-full h-32"
        placeholder="Enter content"
      ></textarea>
    </label>

    <label class="input input-bordered flex flex-col gap-2">
      Image Upload:
      <DropFile v-model="form.imageUrl" />
    </label>

    <label class="input input-bordered flex items-center gap-2">
      Forum ID:
      <input
        id="forumId"
        type="number"
        v-model="form.forumId"
        class="grow"
        placeholder="Enter forum ID"
      />
    </label>

    <label class="input input-bordered flex items-center gap-2">
      Flair ID:
      <input
        id="flairId"
        type="number"
        v-model="form.flairId"
        class="grow"
        placeholder="Enter flair ID"
      />
    </label>

    <button class="btn btn-primary w-full" type="submit" :disabled="form.processing">Submit</button>
  </form>
</template>
