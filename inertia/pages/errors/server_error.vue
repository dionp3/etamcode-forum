<script setup lang="ts">
defineProps<{ error: any }>()
import { ArrowLeft } from 'lucide-vue-next'
function goBack() {
  window.history.back()
}
</script>

<template>
  <MainLayout>
    <template #main-content>
      <pre>{{ error }}</pre>
      <div class="card-title">Server Error</div>

      <span>{{ error.message }}</span>

      <a @click.prevent="goBack" class="btn btn-sm rounded-full btn-ghost">
        <ArrowLeft /> Go Back
      </a>
    </template>
  </MainLayout>
</template>
