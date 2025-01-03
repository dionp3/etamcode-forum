<script setup lang="ts">
import { ref } from 'vue'
const moderator = ref([
  {
    image: 'https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp',
    name: 'Moderators 1',
  },
  {
    image: 'https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp',
    name: 'Moderators 2',
  },
  {
    image: 'https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp',
    name: 'Moderators 3',
  },
  {
    image: 'https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp',
    name: 'Moderators 4',
  },
  {
    image: 'https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp',
    name: 'Moderators 5',
  },
])
ref
</script>

<template>
  <div class="w-full p-2 border border-primary rounded-lg">
    <div class="flex flex-col gap-2">
      <h2 class="font-bold text-xl mb-2">Moderators</h2>
      <div class="flex flex-col gap-4 mb-2">
        <div
          class="flex flex-row gap-4 items-center hover:bg-neutral p-2 rounded-lg hover:cursor-pointer hover:text-neutral-content"
          v-for="(item, index) in moderator"
          :key="index"
        >
          <div class="avatar">
            <div class="w-12 rounded-lg">
              <img :src="item.image" alt="" class="" />
            </div>
          </div>
          <p class="font-medium">{{ item.name }}</p>
        </div>
      </div>
      <button class="btn btn-secondary">Message the Moderator</button>
      <button class="btn btn-outline btn-secondary">View All Moderators</button>
    </div>
  </div>
</template>
