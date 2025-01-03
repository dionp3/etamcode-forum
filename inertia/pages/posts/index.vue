<script setup lang="ts">
import type PostsController from '#controllers/posts_controller'
import type { InferPageProps } from '@adonisjs/inertia/types'
import { onMounted, ref } from 'vue'
import axios from 'axios'
import type { PaginateMeta } from '~/types'

const { posts: postsProps, paginate: paginateProps } = defineProps<{
  posts: InferPageProps<PostsController, 'index'>['posts']
  paginate: PaginateMeta
}>()
const posts = ref([...(postsProps || [])])
const paginate = ref(paginateProps)
const loading = ref(false) // To track if we're already loading postsa
// To track if we've reached the last page, initially set to true if there's no
// nextPageUrl
const isLastPage = ref(!paginate.value.nextPageUrl)
// Function to load more posts
const loadMorePosts = async () => {
  if (loading.value || isLastPage.value || !paginate.value.nextPageUrl) return

  loading.value = true

  try {
    // Make an axios request to the next page's URL, which is passed via paginate object
    const response = await axios.get(paginate.value.nextPageUrl)

    const { posts: newPosts, paginate: newPaginate } = response.data
    if (!newPosts) return

    posts.value.push(...newPosts) // Append new posts to existing ones
    paginate.value = newPaginate // Update pagination metadata

    // If there are no more pages, set isLastPage to true
    if (!paginate.value.nextPageUrl) {
      isLastPage.value = true
    }
  } catch (error) {
    console.error('Error loading more posts:', error)
  } finally {
    loading.value = false
  }
}

// Set up IntersectionObserver to trigger loadMorePosts when bottom is reached
onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          loadMorePosts()
        }
      }
    },
    {
      root: null, // Use the viewport as the root
      rootMargin: '0px 0px 300px 0px', // Trigger the load 100px before reaching the bottom of the viewport
      threshold: 0.1, // Trigger when 10% of the element is in view
    },
  )

  const loader = document.querySelector('#loadMoreObserver')
  if (loader) {
    observer.observe(loader)
  }
})
</script>

<template>
  <ContentContainer>
    <div v-for="post in posts" key="post.slug">
      <PostCard :post="post" />
      <div class="divider"></div>
    </div>
    <!-- The Loading Skeleton & Loader -->
    <div v-if="!isLastPage" id="loadMoreObserver" class="flex justify-center items-center w-full h-20">
      <span class="loading loading-dots loading-lg"></span>
    </div>
    <!-- The Loading Skeleton & Loader -->
    <div v-if="!isLastPage" id="loadMoreObserver" class="flex justify-center items-center w-full h-20">
      <span class="loading loading-dots loading-lg"></span>
    </div>
    <template #side-content>
      <PremiumCard />
      <ForumSideCard />
      <PopularHashtag />
      <ForumInfoCard />
      <ForumRules />
      <ForumModerator />
    </template>
  </ContentContainer>
</template>
