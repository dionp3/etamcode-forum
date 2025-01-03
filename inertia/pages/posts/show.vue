<script setup lang="ts">
import { usePage } from '@inertiajs/vue3'
import { ArrowLeft } from 'lucide-vue-next'
import { computed } from 'vue'
import type { Comment, Post } from '~/types'

const page = usePage<{ post: Post; comments: Comment[] }>()
const post = computed(() => page.props.post)
const comments = computed(() => page.props.comments) // Get comments from page props

function goBack() {
  window.history.back()
}
</script>

<template>
  <MainLayout>
    <template #main-content>
      <button @click.prevent="goBack" class="btn rounded-full"><ArrowLeft />Back</button>
      <PostCard :post="post" />
      <CommentTree :comments="comments" />
    </template>
    <template #side-content>
      <ForumSideCard />
      <div class="divider"></div>
      <PopularHashtag />
      <div class="divider"></div>
    </template>
  </MainLayout>
</template>
