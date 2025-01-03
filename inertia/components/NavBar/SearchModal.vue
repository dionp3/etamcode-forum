<template>
  <div class="modal-box w-11/12 max-w-5xl min-h-80 max-h-[60%] flex flex-col">
    <!-- Search Input -->
    <div class="sticky top-0 mb-4">
      <label class="input input-bordered flex items-center gap-2">
        <Search />
        <input type="text" class="grow" placeholder="Search" v-model="searchQuery" @input="handleSearch" />
      </label>
    </div>

    <!-- Search Results -->
    <div class="overflow-y-auto grow">
      <ul v-if="hasResults">
        <!-- Posts -->
        <li class="text-sm font-bold text-neutral-500 mb-2">Posts</li>
        <li v-for="post in posts" :key="post.slug" class="cursor-pointer hover:border hover:border-gray-300 p-2 rounded"
          @click="navigateTo(`/f/${post.forumName}/posts/${post.slug}`) ">
          <p class="text-sm font-medium">{{ post.title }}</p>
          <p class="text-xs text-neutral-500">{{ post.content }}</p>
        </li>
        <div v-if="posts.length" class="divider my-4"></div>

        <!-- Forums -->
        <li class="text-sm font-bold text-neutral-500 mb-2">Forums</li>
        <li v-for="forum in forums" :key="forum.name"
          class="cursor-pointer hover:border hover:border-gray-300 p-2 rounded" @click="navigateTo(`/f/${forum.name}`)">
          <p class="text-sm font-medium">{{ forum.name }}</p>
        </li>
        <div v-if="forums.length" class="divider my-4"></div>

        <!-- Users -->
        <li class="text-sm font-bold text-neutral-500 mb-2">Users</li>
        <li v-for="user in users" :key="user.username"
          class="cursor-pointer hover:border hover:border-gray-300 p-2 rounded"
          @click="navigateTo(`/u/${user.username}`)">
          <p class="text-sm font-medium">{{ user.profile.displayName || user.username }}</p>
        </li>
      </ul>
      <div v-else class="text-center text-neutral-600">Start searching something...</div>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</template>



<script setup lang="ts">
import { ref, computed, onBeforeUnmount, onMounted } from 'vue'
import axios from 'axios'
import { Search } from 'lucide-vue-next'
import { router } from '@inertiajs/vue3'

// Define TypeScript interfaces for the search results
interface Post {
  title: string
  content: string
  slug: string
  forumName: string
}

interface Forum {
  name: string
  iconUrl: string
}

interface Profile {
  displayName: string | null
  avatarUrl: string | null
}

interface User {
  username: string
  profile: Profile
}

// Define reactive variables
const searchQuery = ref('')
const posts = ref<Post[]>([])
const forums = ref<Forum[]>([])
const users = ref<User[]>([])

// Define a reactive variable for loading state

// Define a timeout variable for debounce
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Computed property to determine if any results exist
const hasResults = computed(() => posts.value.length > 0 || forums.value.length > 0 || users.value.length > 0)

// Handle search input with debounce
const handleSearch = () => {
  // Clear the previous timeout if it exists
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  if (searchQuery.value.length < 1) {
    posts.value = []
    forums.value = []
    users.value = []
    return
  }

  // Set a new timeout
  searchTimeout = setTimeout(() => {
    performSearch(searchQuery.value)
  }, 300) // Adjust the debounce delay as needed (300ms here)
}

const searchCache = ref(new Map<string, { posts: Post[]; forums: Forum[]; users: User[] }>())

const performSearch = async (query: string) => {
  if (!query.trim()) {
    posts.value = []
    forums.value = []
    users.value = []
    return
  }

  // Check if the query exists in the cache
  const cachedResult = searchCache.value.get(query)
  if (cachedResult) {
    posts.value = cachedResult.posts
    forums.value = cachedResult.forums
    users.value = cachedResult.users
    return
  }

  try {
    const response = await axios.get(`/search/all/?q=${encodeURIComponent(query)}`)

    const { posts: fetchedPosts, forums: fetchedForums, users: fetchedUsers } = response.data

    posts.value = fetchedPosts || []
    forums.value = fetchedForums || []
    users.value = fetchedUsers || []

    // Cache the results
    searchCache.value.set(query, {
      posts: posts.value,
      forums: forums.value,
      users: users.value,
    })
  } catch (error) {
    console.error('Error fetching search results:', error)
    posts.value = []
    forums.value = []
    users.value = []
  }
}

const showModal = (event: KeyboardEvent) => {
  if (event.ctrlKey && event.key === 'k') {
    event.preventDefault()
    const search_modal = document.getElementById('search_modal') as HTMLDialogElement
    search_modal.open ? search_modal.close() : search_modal.showModal()
  }
}

const navigateTo = (url: string) => {
  // Gunakan router Vue jika tersedia
  if (typeof router !== 'undefined') {
    router.visit(url)
  } else {
    // Jika router tidak tersedia, gunakan navigasi browser
    window.location.href = url
  }
}

// Clean up the timeout when the component is unmounted
onBeforeUnmount(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  document.removeEventListener('keydown', showModal, true)
})

onMounted(() => {
  document.addEventListener('keydown', showModal, true)
})
</script>
