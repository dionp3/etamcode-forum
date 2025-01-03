<script lang="ts" setup>
import type { InferPageProps } from '@adonisjs/inertia/types'
import type { PaginateMeta } from '~/types'
import { toRaw } from 'vue'

import { ArrowLeft } from 'lucide-vue-next'
import type ForumController from '#controllers/forums_controller'
import { Deferred, WhenVisible } from '@inertiajs/vue3'

// Define props with the correct structure
const { flairs } = defineProps<{
  forum: InferPageProps<ForumController, 'show'>['forum']
  paginate: PaginateMeta
  posts?: InferPageProps<ForumController, 'show'>['posts']
  flairs: InferPageProps<ForumController, 'show'>['flairs']
  isFollowed: boolean
  followers: InferPageProps<ForumController, 'show'>['followers']
  userCanEdit: boolean
}>()

const allFlairs = toRaw(flairs)

function goBack() {
  window.history.back()
}
</script>

<template>
  <ContentContainer>
    <template #banner-content>
      <button @click.prevent="goBack" class="btn btn-sm btn-circle btn-ghost w-20 mb-4">
        <ArrowLeft /> Back
      </button>
      <ForumCard :forum="forum" :flairs="allFlairs" :isFollowed="isFollowed" :userCanEdit="userCanEdit"> </ForumCard>
    </template>
    <Deferred data="posts">
      <template #fallback>
        <div class="text-center">
          <span class="loading loading-dots loading-lg"></span>
        </div>
      </template>
      <div v-for="post in posts" :key="post.slug">
        <PostCard :post="post" :link="`/f/${forum.name}/posts/${post.slug}`" />
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
