<script lang="ts" setup>
import { ArrowLeft } from 'lucide-vue-next'
defineProps<{ error: any }>()

function goBack() {
  window.history.back()
}
</script>
<template>
  <MainLayout>
    <template #main-content>
      <div class="card-title">Page not found</div>
      <span>{{ error.message }}</span>

      <span>This page does not exist.</span>
      <a @click.prevent="goBack" class="btn btn-sm rounded-full btn-ghost">
        <ArrowLeft /> Go Back
      </a>
    </template>
  </MainLayout>
</template>
