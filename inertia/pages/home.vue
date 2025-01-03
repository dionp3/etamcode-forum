<script setup lang="ts">
import { Head, usePage } from '@inertiajs/vue3'
import { computed } from 'vue'
import type { PaginateMeta, Post } from '~/types'
const page = usePage<{ props: { paginate: PaginateMeta; posts: Post[] } }>()
const posts = computed(() => page.props.posts)
const paginate = computed(() => page.props.paginate)
</script>

<template>
  <Head title="Homepage" />
  <MainLayout>
    <template #banner-content>
      🥶🥶🥶🥶
      <div class="card bg-red-50 w-full">
        <div class="card-body">
          <h2 class="card-title">Shoes!</h2>
          <p>If a dog chews shoes whose shoes does he choose?</p>
          <div class="card-actions justify-end">
            <button class="btn btn-primary">Buy Now</button>
          </div>
        </div>
      </div>
    </template>
    <template #main-content>
      <FilterBar />
      <PostList :posts="posts" />
      <PaginationMenu :paginate="paginate" route="/" />
    </template>
    <template #side-content>
      <adBanner />
    </template>
  </MainLayout>
</template>
