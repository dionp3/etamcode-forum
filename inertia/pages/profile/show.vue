<script lang="ts" setup>
import { Deferred, WhenVisible, router } from '@inertiajs/vue3'
import { ArrowLeft } from 'lucide-vue-next'
import type { PaginateMeta, Post, Profile } from '~/types'

defineProps<{
  profile: Profile
  posts?: Post[]
  paginate: PaginateMeta
  isFollower: boolean
}>()

function goBack() {
  if (window.history.length > 1) {
    window.history.back()
  } else {
    router.visit('/')
  }
}
</script>

<template>
  <ContentContainer>
    <template #banner-content>
      <button @click.prevent="goBack" class="btn btn-ghost btn-sm rounded-full mb-4">
        <ArrowLeft />Back
      </button>
      <ProfileCard :profile="profile" :isFollower="isFollower" />
    </template>
    <Deferred data="posts">
      <template #fallback>
        <div class="text-center">
          <span class="loading loading-dots loading-lg"></span>
        </div>
      </template>
      <div v-for="post in posts" :key="post.slug">
        <PostCard :post="post" :link="`f/${post.forumName}/posts/${post.slug}`" />
        <div class="divider"></div>
      </div>
      <WhenVisible v-if="paginate.currentPage !== paginate.lastPage" :params="{
        data: { page: paginate.currentPage + 1 },
        only: ['paginate', 'posts']
      }" data="posts" always>
        <div class="text-center">
          <span class="loading loading-dots loading-lg"></span>
        </div>
      </WhenVisible>
      <div v-else class="text-center text-gray-500 dark:text-gray-400">
        <span>You are on the last page</span>
      </div>
    </Deferred>
    <template #side-content>
      <AdBanner />
    </template>
  </ContentContainer>
</template>
