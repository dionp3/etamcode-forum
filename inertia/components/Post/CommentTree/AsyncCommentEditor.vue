<template>
  <div role="tablist" class="tabs tabs-lifted mb-4">
    <a role="tab" class="tab" :class="{ 'tab-active': activeTab === 'write' }"
      @click.prevent="setActiveTab('write')">Write</a>
    <a role="tab" class="tab" :class="{ 'tab-active': activeTab === 'preview' }"
      @click.prevent="setActiveTab('preview')">Preview</a>
  </div>

  <!-- Write Tab (Textarea) -->
  <textarea v-if="activeTab === 'write'" id="content" class="textarea textarea-bordered w-full h-36"
    placeholder="Content" v-model="form.content" />
  <!-- Preview Tab (Markdown Renderer) -->
  <div v-if="activeTab === 'preview'" class="p-1 h-36 overflow-y-auto w-full">
    <div v-html="renderMarkdown(form.content)" class="prose">
    </div>
  </div>

  <!-- Error Message -->
  <div v-if="errors.content" class="label">
    <span class="label-text-alt text-red-500 text-sm">
      {{ errors.content }}
    </span>
  </div>

  <!-- Buttons -->
  <div class="flex justify-end space-x-2">
    <button @click.prevent="$emit('cancel')" class="btn btn-sm rounded-full btn-secondary btn-outline bg-base-200">
      Cancel
    </button>
    <button @click.prevent="submitForm" class="btn btn-sm rounded-full btn-primary btn-outline bg-base-200">
      Submit
    </button>
  </div>
</template>

<script setup lang="ts">
import { renderMarkdown } from '~/utils/markdown_formatter'
import { reactive, ref } from 'vue'
import axios, { isAxiosError } from 'axios'

// Define props and emits
const {
  content,
  postRoute,
  method = 'POST',
  parentCommentId = null,
} = defineProps<{ postRoute: string; content?: string; method?: string; parentCommentId?: number }>()

// Emit declaration
const emit = defineEmits(['cancel', 'success'])

const activeTab = ref<'write' | 'preview'>('write')
const form = reactive({
  content: content || '', // Default content
})
const errors = ref<{ content?: string }>({}) // To store validation errors

// Method to toggle between tabs
const setActiveTab = (tab: 'write' | 'preview') => {
  activeTab.value = tab
}

// Submit form using Axios
const submitForm = async () => {
  try {
    // Clear any previous errors
    errors.value = {}
    if (method === 'PUT') {
      // Make PUT request
      await axios.put(postRoute, { content: form.content })
    } else {
      // Make POST request
      await axios.post(postRoute, { content: form.content, parentCommentId: parentCommentId })
    }
    emit('success')

    // Handle success (e.g., show a success message, reset form, etc.)
  } catch (error: unknown) {
    // Handle errors
    if (isAxiosError(error) && error.response?.data?.errors) {
      // If it's an Axios error and has validation errors, assign them
      errors.value = error.response.data.errors
    } else {
      console.error('Unexpected error:', error)
    }
  }
}
</script>
