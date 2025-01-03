<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
defineProps<{ error: Error }>()
const goBack = () => window.history.back()
</script>

<template>
  <ContentContainer>
    <div class="card-title">you have insufficient permissions to this resource</div>

    <span>{{ error.message }}</span>

    <a @click.prevent="goBack" class="btn btn-sm rounded-full btn-ghost">
      <ArrowLeft /> Go Back
    </a>
  </ContentContainer>
</template>
