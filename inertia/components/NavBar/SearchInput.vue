<template>
  <div class="relative">
    <label class="input input-bordered flex items-center gap-2 rounded-full p-2">
      <Search />
      <input
        type="text"
        class="grow placeholder-gray-500 text-base-content bg-base-200 rounded-md p-2"
        placeholder="Search"
        v-model="searchQuery"
        @input="handleSearch"
      />
    </label>

    <!-- Dropdown to display search results -->
    <div
      v-if="hasResults"
      class="absolute top-full w-full mt-2 bg-base-200 rounded-lg shadow-lg p-4 z-20"
      style="max-height: 400px; overflow-y: auto"
    >
      <!-- Display posts -->
      <div v-if="posts.length">
        <h3 class="font-bold text-accent border-b-[1px] border-accent mb-2">Posts</h3>
        <ul class="space-y-2">
          <li v-for="post in posts" :key="post.id">
            <Link
              :href="`/posts/${post.id}`"
              class="block p-2 rounded-lg hover:bg-accent hover:text-base-100"
            >
              {{ post.title }}
            </Link>
          </li>
        </ul>
      </div>

      <!-- Display forums -->
      <div v-if="forums.length">
        <h3 class="font-bold text-accent border-b-[1px] border-accent mb-2">Forums</h3>
        <ul class="space-y-2">
          <li v-for="forum in forums" :key="forum.id">
            <Link
              :href="`/forums/${forum.id}`"
              class="block p-2 rounded-lg hover:bg-accent hover:text-base-100"
            >
              {{ forum.name }}
            </Link>
          </li>
        </ul>
      </div>

      <!-- Display users -->
      <div v-if="users.length">
        <h3 class="font-bold text-accent border-b-[1px] border-accent mb-2">Users</h3>
        <ul class="space-y-2">
          <li v-for="user in users" :key="user.id">
            <Link
              :href="`/users/${user.id}`"
              class="block p-2 rounded-lg hover:bg-accent hover:text-base-100"
            >
              {{ user.username }}
            </Link>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Search } from 'lucide-vue-next'
import { Link } from '@inertiajs/vue3'
import { searchQuery, posts, forums, users, handleSearch } from './search_input'

// Computed property to determine if any results exist
const hasResults = computed(
  () => posts.value.length > 0 || forums.value.length > 0 || users.value.length > 0
)
</script>
