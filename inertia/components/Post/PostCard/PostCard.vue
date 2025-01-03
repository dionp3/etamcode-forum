<template>
  <div class="card shadow">
    <div class="card-body">
      <PostHeader v-bind="postHeaderData" @delete="$emit('delete')" />
      <Link v-if="link" :href="link">
      <PostBody v-bind="postBodyData" />
      </Link>
      <PostBody v-else v-bind="postBodyData" />

      <PostFooter v-bind="postFooterData" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits(['delete'])
// forumName is used for forum page, because the forum is already loaded, so
// each post's forum data are replaced with only one forum data
const { post, link } = defineProps<{
  post: {
    avatarUrl: string
    forumName?: string
    username: string
    displayName?: string
    createdAt: string
    title: string
    flair: { name: string; color: string }
    content?: string
    imageUrl: string
    slug: string
    totalScore: string
    totalComments: string
    userVoteScore: number
  }
  link?: string
}>()

const postHeaderData = {
  avatarUrl: post.avatarUrl,
  forumName: post.forumName || null,
  username: post.username || null,
  displayName: post.displayName || `u/${post.username}` || null,
  createdAt: post.createdAt,
  link: link || null,
}

const postBodyData = {
  title: post.title,
  content: post.content || null,
  imageUrl: post.imageUrl,
  flair: post.flair,
}

const postFooterData = {
  totalScore: post.totalScore,
  totalComments: post.totalComments,
  link: link || null,
  slug: post.slug,
  forumName: post.forumName,
  userVoteScore: post.userVoteScore,
}
</script>
