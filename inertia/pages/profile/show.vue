<script lang="ts" setup>
import { ArrowLeft } from 'lucide-vue-next'
import type { PaginateMeta, Post, Profile } from '~/types'

// Define props with the correct structure
defineProps<{ profile: Profile; posts: Post[]; paginate: PaginateMeta }>()
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
      <ProfileCard :profile="profile" />
    </template>
    <template #main-content>
      <PostList :posts="posts" />
    </template>
  </MainLayout>
</template>
