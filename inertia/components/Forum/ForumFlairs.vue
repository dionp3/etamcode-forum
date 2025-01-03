<template>
  <div class="w-full p-4 bg-base-100 border border-primary rounded-md">
    <h2 class="text-lg font-bold mb-4">Flairs</h2>
    <div v-if="flairs" class="flex flex-wrap gap-2">
      <a
        v-for="(flair, index) in flairs"
        :key="index"
        :href="flair.link"
        class="badge cursor-pointer"
        :style="{ backgroundColor: flair.color }"
      >
        {{ flair.name }}
      </a>
    </div>
    <p v-else>No flairs available for this forum.</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ flairs: Array<{ name: string; color: string; link: string }> }>()
</script>
