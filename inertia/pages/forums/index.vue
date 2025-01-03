<script lang="ts" setup>
import type { Forum, PaginateMeta } from '~/types'
import { Link } from '@inertiajs/vue3'
// Define props for the list of forums
defineProps<{ forums: Forum[]; paginate: PaginateMeta }>()
</script>

<template>
  <div class="w-full overflow-x-hidden">
    <!-- Adds width and overflow constraints -->
    <div class="columns-1 sm:columns-2 lg:columns-3 gap-5 p-5 w-full">
      <Link
        :href="`/f/${forum.name}`"
        class="block cursor-default"
        v-for="forum in forums"
        :key="forum.id"
      >
        <ForumCard :forum="forum" />
      </Link>
    </div>
    <PaginationMenu :paginate="paginate" route="/f" class="pb-6" />
  </div>
</template>
