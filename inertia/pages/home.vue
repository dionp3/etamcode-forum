<script setup lang="ts">
import type { InferPageProps } from '@adonisjs/inertia/types'
import { Deferred, Head, WhenVisible } from '@inertiajs/vue3'
import type { PaginateMeta } from '~/types'
import type HomeController from '#controllers/home_controller'

defineProps<{
  paginate: PaginateMeta
  posts?: InferPageProps<HomeController, 'index'>['posts']
}>()
</script>

<template>

  <Head title="Homepage" />
  <ContentContainer>
    <template #banner-content>
      <div class="card bg-red-100 dark:bg-blue-900 w-full">
        <div class="card-body">
          <h2 class="card-title">Shoes!</h2>
          <p>If a dog chews shoes whose shoes does he choose?</p>
          <div class="card-actions justify-end">
            <button class="btn btn-primary">Buy Now</button>
          </div>
        </div>
      </div>
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
      <adBanner />
    </template>
  </ContentContainer>
</template>
