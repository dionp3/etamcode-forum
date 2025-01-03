<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
const goBack = () => window.history.back()
</script>

<template>
  <ContentContainer>
    <div class="title">Page not found</div>

    <span>This page does not exist.</span>
        <a @click.prevent="goBack" class="btn btn-sm rounded-full btn-ghost">
      <ArrowLeft/> Go Back
    </a>

  </ContentContainer>
</template>
