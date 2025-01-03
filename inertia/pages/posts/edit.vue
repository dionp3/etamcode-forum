<template>
  <ContentContainer>
    <form @submit.prevent="form.patch(`/f/${forum.name}/posts/${post.slug}`)"
      class="form-control w-full max-w-lg mx-auto" autocomplete="off">
      <!-- Title Input -->
      <div class="label">
        <span class="label-text">Title</span>
      </div>
      <input type="text" id="title" v-model="form.title" placeholder="Post Title" class="input input-bordered w-full" />
      <div class="label">
        <span v-if="form.errors.title" class="label-text-alt text-red-500 text-sm">
          {{ form.errors.title }}
        </span>
      </div>

      <!-- Content Input -->
      <div class="label">
        <span class="label-text">Content</span>
      </div>
      <div class="card card-bordered p-2">
        <!-- Tab Navigation -->
        <div role="tablist" class="tabs tabs-lifted mb-4">
          <a role="tab" class="tab" :class="{ 'tab-active': activeTab === 'write' }"
            @click.prevent="setActiveTab('write')">Write</a>
          <a role="tab" class="tab" :class="{ 'tab-active': activeTab === 'preview' }"
            @click.prevent="setActiveTab('preview')">Preview</a>
        </div>

        <!-- Preview Tab (Markdown Renderer) -->
        <div v-if="activeTab === 'preview'" v-html="renderMarkdown(form.content)" class="prose"></div>
        <!-- Write Tab (Textarea) -->
        <textarea v-else id="content" class="textarea textarea-bordered w-full" placeholder="Content"
          v-model="form.content" />
      </div>
      <div class="label">
        <span v-if="form.errors.content" class="label-text-alt text-red-500 text-sm">
          {{ form.errors.content }}
        </span>
      </div>

      <!-- Select Component for Flair -->
      <div class="label">
        <span class="label-text">Flair</span>
      </div>
      <!-- Custom Dropdown -->
      <div class="relative">
        <button class="select select-bordered w-full flex justify-between items-center p-2"
          @click.prevent="isFlairFocused = !isFlairFocused">
          <div :class="{ 'badge badge-lg': selectedFlair }" :style="{ backgroundColor: selectedFlair?.color }">{{
            selectedFlair?.name ?
              selectedFlair.name :
              (forum?.flairs ? 'select a flair' : 'no flair available')
          }}</div>
        </button>
        <ul v-if="isFlairFocused && forum?.flairs.length"
          class="absolute z-10 left-0 right-0 mt-2 bg-base-100 shadow-md border-[1px] rounded-md max-h-60 overflow-y-auto">

          <li v-for="flair in forum?.flairs || []" :key="flair.id" @click.prevent="selectFlair(flair)"
            class="flex justify-between items-center p-2 cursor-pointer hover:bg-gray-100 rounded">
            <div class="badge badge-lg" :style="{ backgroundColor: flair?.color }"> {{ flair.name }}</div>
          </li>
        </ul>
      </div>

      <!-- File Input or Display Image -->
      <div class="label">
        <span class="label-text">Image</span>
      </div>

      <!-- File Input if no image selected -->
      <div v-if="!imageUrl" class="file-input-container">
        <input type="file" id="imageFile" accept=".png, .jpg, .jpeg" class="file-input file-input-bordered w-full"
          @input.prevent="handleFileInput" />
      </div>

      <!-- Display selected image with close button -->
      <div v-if="imageUrl" class="relative w-full max-w-md mx-auto">
        <img :src="imageUrl" alt="Selected Image" class="w-full h-auto rounded-lg" />
        <button
          class="btn btn-circle btn-sm bg-black hover:bg-black bg-opacity-15 hover:bg-opacity-30 border-0 absolute top-2 right-2"
          @click="imageUrl = null">
          <X class="stroke-white mix-blend-exclusion" />
        </button>
      </div>

      <div class="label">
        <span v-if="form.errors.imageFile" class="label-text-alt text-red-500 text-sm">
          {{ form.errors.imageFile }}
        </span>
      </div>

      <!-- Submit Button -->
      <div class="flex justify-end">
        <button type="submit" class="btn btn-primary">
          <span v-if="form.processing" class="loading loading-spinner loading-xs"></span>
          <span v-else>Submit</span>
        </button>
      </div>
    </form>
  </ContentContainer>
</template>

<script lang="ts" setup>
import type PostsController from '#controllers/posts_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { useForm } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import { X } from 'lucide-vue-next'
import { renderMarkdown } from '~/utils/markdown_formatter'
//import { formatErrors } from '~/utils/formatErrors'

const { post, forum } = defineProps<{
  post: InferPageProps<PostsController, 'edit'>['post']
  forum: InferPageProps<PostsController, 'edit'>['forum']
}>()

interface Flair {
  id: number
  name: string
  color: string
}

const selectedFlair = ref<Flair | null>(post.flair)
const isFlairFocused = ref(false)
const imageUrl = ref<string | null>(post.imageUrl || null)
const imageRemoved = computed(() => imageUrl.value !== post.imageUrl)

const activeTab = ref<'write' | 'preview'>('write')
// Method to toggle between tabs
const setActiveTab = (tab: 'write' | 'preview') => {
  activeTab.value = tab
}

const form = useForm({
  title: post.title,
  content: post.content || '',
  flairId: post.flair?.id as string | number,
  imageFile: null as File | null,
  imageRemoved,
})

const selectFlair = (flair: Flair) => {
  selectedFlair.value = flair
  form.flairId = flair.id
  isFlairFocused.value = false
}

const handleFileInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) {
    const file = input.files[0]
    if (file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) {
      imageUrl.value = URL.createObjectURL(file)
      form.imageFile = file
    } else {
      form.errors.imageFile = 'Please upload a valid image file (max 5MB).'
    }
  }
}
</script>
