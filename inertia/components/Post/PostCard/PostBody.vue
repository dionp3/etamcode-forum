<template>
  <span v-if="flair" class="badge badge-lg" :style="{ backgroundColor: flair.color }">
    {{ flair.name }}
  </span>
  <h1 class="card-title">{{ title }}</h1>
  <div v-if="content" v-html="renderMarkdown(content)" class="prose"></div>
  <figure v-if="imageUrl" class="relative w-full h-full overflow-hidden flex items-center justify-center rounded-2xl">
    <div class="absolute inset-0 bg-cover bg-center blur-lg" :style="{ backgroundImage: `url(${imageUrl})` }"></div>
    <img :src="imageUrl" :alt="'image of ' + title" class="relative max-h-full w-auto object-contain" />
  </figure>
</template>

<script setup lang="ts">
import { renderMarkdown } from '~/utils/markdown_formatter'

// Props
defineProps<{
  title: string
  content?: string
  imageUrl?: string
  flair?: { name: string; color: string }
}>()
</script>
