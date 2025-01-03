<script setup lang="ts">
import { ref } from 'vue'
import { Ellipsis } from 'lucide-vue-next'

const Hashtags = ref([
  {
    tags: 'Indonesia',
    count: '675000 posts',
  },
  {
    tags: 'AMD',
    count: '2000000 posts',
  },
  {
    tags: 'vue.js',
    count: '110000 posts',
  },
  {
    tags: 'webdev',
    count: '2600000 posts',
  },
])
</script>

<template>
  <div class="w-full p-2 border border-primary rounded-lg">
    <h2 class="font-bold text-xl mb-2">Tren untuk Anda</h2>
    <div class="flex flex-col justify-center w-full gap-4">
      <div
        v-for="(hashtag, index) in Hashtags"
        :key="index"
        class="flex flex-row justify-between items-center w-full p-2 hover:cursor-pointer hover:bg-neutral hover:text-neutral-content rounded-lg"
      >
        <div class="flex flex-col gap-1">
          <h3 class="font-semibold">{{ hashtag.tags }}</h3>
          <p class="font-normal">{{ hashtag.count }}</p>
        </div>
        <Ellipsis />
      </div>
      <div class="text-sm font-medium text-secondary hover:cursor-pointer">show more</div>
    </div>
  </div>
</template>
