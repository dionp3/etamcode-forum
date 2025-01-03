<script lang="ts" setup>
import type { Forum, Post } from '~/types'
import { Link } from '@inertiajs/vue3'
// Accept the posts as props (data will come from the parent via Inertia or directly via props)
defineProps<{
  posts: Post[]
  forum?: Forum
}>()
</script>
<template>
  <Link
    :href="`/f/${forum?.name || post.forum?.name}/posts/${post.slug}`"
    class="cursor-default"
    v-for="post in posts"
    :key="post.id"
  >
    <PostCard :post="post" />
    <div class="divider"></div>
  </Link>
</template>
