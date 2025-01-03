<script lang="ts" setup>
import { ArrowLeft } from 'lucide-vue-next'
import type { Forum, PaginateMeta, Post } from '~/types'

// Define props with the correct structure
defineProps<{ forum: Forum; paginate: PaginateMeta; posts: Post[] }>()

function goBack() {
  window.history.back()
}
</script>

<template>
  <MainLayout>
    <template #banner-content>
      <button @click.prevent="goBack" class="btn btn-sm btn-circle btn-ghost">
        <ArrowLeft />
      </button>
      <ForumCard :forum="forum" />
    </template>
    <template #main-content>
      <PostList :posts="posts" :forum="forum" />
    </template>
  </MainLayout>
</template>
