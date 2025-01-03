<script lang="ts" setup>
import { isDarkTheme } from '~/store/theme_state'
import { Sun, Moon } from 'lucide-vue-next'
</script>

<template>
  <label class="swap swap-rotate mx-2">
    <input type="checkbox" v-model="isDarkTheme" />
    <Sun class="swap-off stroke-yellow-500" />
    <Moon class="swap-on stroke-blue-300" />
  </label>
</template>
