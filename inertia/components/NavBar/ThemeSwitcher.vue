<script lang="ts" setup>
import { isDarkTheme, toggleTheme } from '~/store/theme_state'
import { Sun, Moon } from 'lucide-vue-next'
</script>

<template>
  <label class="swap swap-rotate mx-2">
    <input type="checkbox" @change="toggleTheme" :checked="isDarkTheme" />
    <Sun class="swap-off sun" />
    <Moon class="swap-on moon" />
  </label>
</template>

<style lang="postcss" scoped>
.lucide.sun {
  @apply text-yellow-500;
}

.lucide.moon {
  @apply text-blue-300;
}
</style>
