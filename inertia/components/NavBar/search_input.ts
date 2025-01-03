// composables/useSearch.ts
import axios from 'axios'
import { ref } from 'vue'
import type { Ref } from 'vue'
import type { Post, Forum, User } from '~/types'

// Define search result refs
export const searchQuery = ref('')
export const posts = ref<Post[]>([])
export const forums = ref<Forum[]>([])
export const users = ref<User[]>([])

// Higher-order function to create a search request function for each route
export const createSearchFunction = (url: string, resultRef: Ref<any[]>) => {
  return async (query: string) => {
    try {
      const response = await axios.get(url, { params: { query } })
      resultRef.value = response.data.posts || response.data.forums || response.data.users || []
    } catch (error) {
      console.error(`Error fetching search results from ${url}:`, error)
      resultRef.value = [] // Clear results on error
    }
  }
}

// Create independent search functions for posts, forums, and users
export const searchPosts = createSearchFunction('/search/posts', posts)
export const searchForums = createSearchFunction('/search/forums', forums)
export const searchUsers = createSearchFunction('/search/users', users)

// Debounce timer
let debounceTimer: NodeJS.Timeout | number = 0

// Handle search with debouncing
export const handleSearch = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    if (searchQuery.value.length > 2) {
      // Only search after typing 3+ characters
      searchPosts(searchQuery.value)
      searchForums(searchQuery.value)
      searchUsers(searchQuery.value)
    } else {
      // Clear results if query is too short
      posts.value = []
      forums.value = []
      users.value = []
    }
  }, 300) // Adjust debounce delay as needed
}
