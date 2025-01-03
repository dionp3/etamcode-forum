<script lang="ts" setup>
import type { Forum } from '~/types'

defineProps<{ forums: Forum[] }>()
</script>
<template>
  <div class="drawer">
    <input id="rapli-sidebar" type="checkbox" class="drawer-toggle" />
    <div class="drawer-side lg:hidden z-20">
      <label for="rapli-sidebar" aria-label="close sidebar" class="drawer-overlay"></label>
      <!-- Sidebar content here -->
      <SideNav :forums="forums" class="min-h-full w-80 bg-base-200" />
    </div>
  </div>
</template>
