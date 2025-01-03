<script lang="ts" setup>
import type { Comment } from '~/types'
defineProps<{ comments: Comment[] }>()
</script>
<template>
  <div>
    <CommentNode v-for="comment in comments" :key="comment.id" :comment="comment" />
  </div>
</template>
