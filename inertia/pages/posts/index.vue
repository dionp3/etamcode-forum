<script setup lang="ts">
import { usePage } from '@inertiajs/vue3'
import { computed } from 'vue'
import type Post from '#models/post'

const page = usePage<{ props: { isAuth: boolean; posts: Post[] } }>()
//const isAuth = computed(() => page.props.isAuth)
const posts = computed(() => page.props.posts)
const paginate = computed(() => page.props.paginate)
</script>

<template>
  <MainLayout>
    <template #main-content>
      <PostList :posts="posts" />
      <PaginationMenu :paginate="paginate" route="/posts" />
    </template>
    <template #side-content>
      <PremiumCard />
      <div class="divider"></div>
      <ForumSideCard />
      <div class="divider"></div>
      <PopularHashtag />
      <div class="divider"></div>
      <ForumInfoCard />
      <div class="divider"></div>
      <ForumRules />
      <div class="divider"></div>
      <ForumModerator />
    </template>
  </MainLayout>
</template>
