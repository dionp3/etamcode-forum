<script lang="ts" setup>
import type { Forum, PaginateMeta } from '~/types'
import { useForm, router } from '@inertiajs/vue3'
import { ArrowLeft } from 'lucide-vue-next'
// Define props for the list of forums
defineProps<{ forums: Forum[]; paginate: PaginateMeta }>()
function goBack() {
  if (window.history.length > 1) {
    window.history.back()
  } else {
    router.visit('/')
  }
}
</script>

<template>
  <div class="w-full overflow-x-hidden">
    <button @click.prevent="goBack" class="btn btn-ghost btn-sm rounded-full mb-4">
      <ArrowLeft />Back
    </button>
    <!-- Adds width and overflow constraints -->
    <div class="columns-1 sm:columns-2 lg:columns-3 gap-5 p-5 w-full">
      <Link :href="`/f/${forum.name}`" class="block cursor-default" v-for="forum in forums" :key="forum.id">
      <ForumCard :forum="forum" />
      </Link>
    </div>
    <PaginationMenu :paginate="paginate" route="/f" class="pb-6" />
  </div>
</template>
