<template>
  <ContentContainer>
    <button @click.prevent="goBack" class="btn btn-ghost btn-sm rounded-full">
      <ArrowLeft />Back
    </button>
    <form @submit.prevent="form.post('/post')" class="form-control w-screen max-w-screen-lg mx-auto p-6"
      autocomplete="off">
      <!-- Title Input -->
      <div class="label">
        <span class="label-text">Title</span>
      </div>
      <input type="text" id="title" v-model="form.title" placeholder="Post Title" class="input input-bordered w-full mb-2" />
      <div class="label">
        <span v-if="form.errors.title" class="label-text-alt text-red-500 text-sm">
          {{ form.errors.title }}
        </span>
      </div>

      <!-- Content Input -->
      <div class="label">
        <span class="label-text">Content</span>
      </div>
      <div class="card card-bordered p-2 mb-2">
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


      <!-- Forum Search Input -->
      <div class="label">
        <span class="label-text">Forum</span>
      </div>
      <div class="relative">
        <label class="input input-bordered flex items-center gap-2"
          :class="isValidInput ? 'focus:input-success' : 'focus:input-error'">
          <img v-if="selectedForum?.iconUrl" :src="selectedForum?.iconUrl" alt="Forum Icon"
            class="w-6 h-6 rounded-full" />
          <input v-model="forumInput" type="text" class="grow" id="forumInput" placeholder="Search for a forum"
            @click="handleSearch" @input="handleSearch" @blur="handleBlur" @focus="form.forumName = null" />
        </label>
        <div v-if="hasResults"
          class="absolute left-0 z-10 right-0 bg-base-100 shadow-md border-[1px] rounded-md max-h-60 overflow-y-auto">
          <ul>
            <li v-for="forum in forums" :key="forum.name"
              class="flex items-center p-2 cursor-pointer hover:bg-gray-100 rounded"
              @click.prevent="selectForum(forum)">
              <img v-if="forum.iconUrl" :src="forum.iconUrl" alt="Forum Icon" class="w-6 h-6 mr-2 rounded-full" />
              <span>{{ forum.name }}</span>
            </li>
          </ul>
        </div>
        <div class="label">
          <span v-if="form.errors.forumName || form.forumName && !isValidInput"
            class="label-text-alt text-red-500 text-sm">
            {{ form.errors.forumName || 'Forum not found' }}
          </span>
        </div>
      </div>

      <!-- Select Component for Flair -->
      <div class="label">
        <span class="label-text">Flair</span>
      </div>
      <!-- Custom Dropdown -->
      <div class="relative ">
        <button class="select select-bordered w-full flex justify-between items-center p-2 mb-4"
          @click.prevent="isFlairFocused = !isFlairFocused">
          <div :class="{ 'badge badge-lg': selectedFlair }" :style="{ backgroundColor: selectedFlair?.color }">{{
            selectedFlair?.name ?
              selectedFlair.name :
              (selectedForum?.flairs ? 'flair not selected' : 'no flair available')
          }}</div>
        </button>
        <div v-if="isFlairFocused && selectedForum?.flairs.length"
          class="absolute left-0 right-0 mt-2 bg-base-100 shadow-md border-[1px] rounded-md max-h-60 overflow-y-auto">
          <ul>
            <li @click.prevent="selectFlair()"
              class="flex justify-between items-center p-2 cursor-pointer hover:bg-gray-100 rounded">
              no flair</li>
            <li v-for="flair in selectedForum?.flairs || []" :key="flair.id" @click.prevent="selectFlair(flair)"
              class="flex justify-between items-center p-2 cursor-pointer hover:bg-gray-100 rounded">
              <div class="badge badge-lg" :style="{ backgroundColor: flair?.color }"> {{ flair.name }}</div>
            </li>
          </ul>
        </div>
      </div>
      <!-- File Input or Display Image -->
      <div class="label">
        <span class="label-text">Image</span>
      </div>

      <!-- File Input if no image selected -->
      <input v-if="!imageUrl" type="file" id="imageFile" class="file-input file-input-bordered w-full mb-4"
        @input.prevent="handleFileInput" />
      <div v-else class="relative w-full max-w-md mx-auto ">
        <img :src="imageUrl" alt="Selected Image" class="w-full h-auto rounded-lg" />
        <button
          class="btn btn-circle btn-sm bg-black hover:bg-black bg-opacity-15 hover:bg-opacity-30 border-0 absolute top-2 right-2 "
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
      <button type="submit" class="btn btn-primary">
        <span v-if="form.processing" class="loading loading-spinner loading-xs"></span>
        <span v-else>Submit</span>
      </button>
    </form>
    <template #side-content>
    </template>
  </ContentContainer>
</template>

<script lang="ts" setup>
import { router, useForm } from '@inertiajs/vue3'
import axios from 'axios'
import { X } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { renderMarkdown } from '~/utils/markdown_formatter'
import { ArrowLeft } from 'lucide-vue-next'
//import { formatErrors } from '~/utils/formatErrors'

interface Flair {
  id: number
  name: string
  color: string
}

interface Forum {
  name: string
  iconUrl: string | null
  flairs: Flair[]
}

const form = useForm({
  title: null as string | null,
  content: '' as string,
  forumName: null as string | null,
  flairId: null as number | null,
  imageFile: null as File | null,
})

const forumInput = ref('')
const selectedForum = ref<Forum | null>(null)
const selectedFlair = ref<Flair | null>(null)
const forums = ref<Forum[]>([])
const isFlairFocused = ref(false)
const imageUrl = ref<string | null>('')
const activeTab = ref<'write' | 'preview'>('write')
// Method to toggle between tabs
const setActiveTab = (tab: 'write' | 'preview') => {
  activeTab.value = tab
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null

const hasResults = computed(() => forums.value.length > 0)

const isValidInput = computed(() => {
  return (
    selectedForum.value?.name?.toLowerCase() === forumInput.value.toLowerCase() ||
    forums.value.some((forum) => forum.name.toLowerCase() === forumInput.value.toLowerCase())
  )
})

const selectFlair = (flair: Flair | null = null) => {
  selectedFlair.value = flair
  form.flairId = flair?.id || null
  isFlairFocused.value = false
}

const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  if (forumInput.value.length < 3) {
    forums.value = []
    return
  }

  searchTimeout = setTimeout(() => {
    performSearch(forumInput.value)
  }, 300)
}

const performSearch = async (query: string) => {
  if (!query.trim()) {
    forums.value = []
    return
  }

  try {
    const response = await axios.get(`/search/forums/?q=${encodeURIComponent(query)}`)
    forums.value = response.data || []
  } catch (error) {
    console.error('Error fetching search results:', error)
    forums.value = []
  }
}

const selectForum = (forum: Forum) => {
  forumInput.value = forum.name
  selectedForum.value = forum
  form.forumName = forum.name
  selectedFlair.value = null
  form.flairId = null
  forums.value = []
}

const handleBlur = () => {
  form.forumName = forumInput.value
  // Check if the forumInput matches any forum name in the forums array
  const matchedForum = forums.value.find((forum) => forum.name.toLowerCase() === forumInput.value.toLowerCase())

  if (matchedForum) {
    selectForum(matchedForum)
  } else {
    selectedForum.value = null
  }
}

const handleFileInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) {
    const file = input.files[0]
    if (file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) {
      form.imageFile = file
      imageUrl.value = URL.createObjectURL(file)
    } else {
      form.errors.imageFile = 'Please upload a valid image file (max 5MB).'
    }
  }
}

function goBack() {
  if (window.history.length > 1) {
    window.history.back()
  } else {
    router.visit('/')
  }
}
</script>
