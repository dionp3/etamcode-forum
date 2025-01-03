<script setup lang="ts">
import { onMounted } from 'vue'
import { useRemember } from '@inertiajs/vue3'
import { fetchForums } from './baselayout_util'

const forums = useRemember([], 'forumsData') // useRemember with a unique key

onMounted(async () => {
  if (forums.value.length === 0) {
    // Fetch data if forums is empty
    forums.value = await fetchForums()
  }
})

defineProps({
  hasSideNav: {
    type: Boolean,
    default: true, // Default to true, showing SideNav by default
  },
})
</script>

<template>
  <SideBar :forums="forums" />
  <header>
    <NavBar />
  </header>
  <main>
    <div class="flex pt-16">
      <aside
        v-if="hasSideNav"
        class="hidden xl:block w-72 flex-shrink-0 border-r-[1px] border-r-base-300 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto"
      >
        <SideNav :forums="forums" />
        <!-- Pass forums as prop -->
      </aside>
      <main class="flex flex-col flex-grow items-center min-w-0 w-full">
        <slot />
      </main>
    </div>
  </main>
</template>
