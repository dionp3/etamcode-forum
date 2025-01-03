<script lang="ts" setup>
import { useSlots } from 'vue'

// Access the slots provided by the parent component
const slots = useSlots()
const hasSideContent = !!slots['side-content']
const hasBanner = !!slots['banner-content']
</script>
<template>
  <!-- Wrapper for Banner, Main Content, and Right Sidebar -->
  <div class="flex flex-col w-full max-w-5xl gap-2">
    <!-- Banner Section -->
    <header v-if="hasBanner" class="w-full">
      <slot name="banner-content" />
    </header>

    <!-- Main Content and Right Sidebar Container -->
    <div class="flex flex-grow">
      <!-- Main Content Area (70%) -->
      <main :class="`flex-grow p-2 ${hasSideContent ? 'basis-2/3' : ''} min-w-0`">
        <slot name="main-content" />
      </main>
      <!-- Right Sidebar (30%) -->
      <aside
        v-if="hasSideContent"
        class="basis-1/3 border-l-base-300 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto hidden md:block p-2 min-w-0"
      >
        <slot name="side-content" />
      </aside>
    </div>
  </div>
</template>
