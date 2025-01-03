<template>
  <nav class="flex justify-center mt-4">
    <div class="join">
      <!-- Previous Button -->
      <button
        class="join-item btn btn-sm"
        :disabled="!paginate.previousPageUrl"
        @click="goToPage(paginate.currentPage - 1)"
      >
        « Prev
      </button>

      <!-- Page Numbers -->
      <button
        v-for="page in pages"
        :key="page"
        class="join-item btn btn-sm"
        :class="{ 'btn-active': page === paginate.currentPage }"
        @click="goToPage(page)"
      >
        {{ page }}
      </button>

      <!-- Next Button -->
      <button
        class="join-item btn btn-sm"
        :disabled="!paginate.nextPageUrl"
        @click="goToPage(paginate.currentPage + 1)"
      >
        Next »
      </button>
    </div>
  </nav>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { PaginateMeta } from '~/types'
import { router } from '@inertiajs/vue3'

const props = defineProps<{
  paginate: PaginateMeta
  route: string
}>()

const pages = computed(() => {
  const total = props.paginate.lastPage
  const current = props.paginate.currentPage
  const delta = 2
  const rangeWithDots = []
  let l: number | null = null

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      if (l && i - l > 1) {
        rangeWithDots.push('...')
      }
      rangeWithDots.push(i)
      l = i
    }
  }

  return rangeWithDots
})

const goToPage = (page: number) => {
  if (page < 1 || page > props.paginate.lastPage) return
  router.visit(`${props.route}?page=${page}`, { preserveState: true, replace: true })
}
</script>
