<template>
  <nav class="flex justify-center mt-4">
    <div class="join">
      <!-- Previous Button -->
      <button class="join-item btn btn-sm" :disabled="!paginate.previousPageUrl"
        @click="goToPage(paginate.currentPage - 1)">
        « Prev
      </button>

      <!-- Page Numbers -->
      <button v-for="page in pages" :key="page" class="join-item btn btn-sm"
        :class="{ 'btn-active': page === paginate.currentPage }" @click="typeof page === 'number' && goToPage(page)">
        {{ page }}
      </button>

      <!-- Next Button -->
      <button class="join-item btn btn-sm" :disabled="!paginate.nextPageUrl"
        @click="goToPage(paginate.currentPage + 1)">
        Next »
      </button>
    </div>
  </nav>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { PaginateMeta } from '~/types'
import { router } from '@inertiajs/vue3'

const { paginate, route } = defineProps<{
  paginate: PaginateMeta
  route: string
}>()

// if -1, it means that it will replaced by '...'
const pages = computed(() => {
  const total = paginate.lastPage
  const current = paginate.currentPage
  const delta = 2
  const rangeWithDots: (number | string)[] = []
  let l: number | null = null

  for (let i = 1; i <= total; i++) {
    if (i <= 4 || i > total - 2 || (i >= current - delta && i <= current + delta)) {
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
  if (page < 1 || page > paginate.lastPage) return
  router.visit(`${route}?page=${page}`, { preserveState: true, replace: true })
}
</script>
