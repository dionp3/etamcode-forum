<template>
  <div class="flex gap-2">
    <div class="flex flex-col items-end justify-between">
      <div class="avatar">
        <div class="w-10 h-10 btn-circle">
          <img :src="avatarUrl" />
        </div>
      </div>
      <label v-if="replies?.length"
        class="btn btn-sm btn-circle bg-base-100 hover:bg-base-100 hover:border-primary swap swap-rotate">
        <input type="checkbox" @change="showReplies = !showReplies" />
        <ChevronUp class="swap-on stroke-primary" />
        <ChevronDown class="swap-off stroke-primary" />
      </label>
    </div>

    <!-- Comment Body -->
    <div class="flex-1 gap-2">
      <header class="flex items-center gap-2">
        <h3 class="font-semibold text-sm">{{ displayName }}</h3>
        •
        <p class="text-xs text-gray-500">{{ formatDate(createdAt) }}</p>
      </header>

      <div v-if="!isEditing" v-html="renderMarkdown(content)" class="prose" />
      <CommentEditor v-else @cancel="isEditing = false" @success="reload"
        :post-route="`${usePage().url}/comments/${slug}`" :content="content" method="PUT" />

      <!-- Action Buttons -->
      <div class="flex">
        <!-- Upvote Button -->
        <button @click.stop="handleUpVote" :class="[
          'btn btn-sm bg-base-100 hover:bg-base-200 join-item btn-circle',
          userHasLiked === 1 ? 'bg-blue-500 hover:bg-blue-600' : 'bg-base-100'
        ]">
          <ArrowBigUp />
        </button>

        <!-- Score Display -->
        <label class="btn btn-sm bg-base-100 hover:bg-base-200 join-item pointer-events-none">{{ totalScore }}</label>

        <!-- Downvote Button -->
        <button @click.stop="handleDownVote" :class="[
          'btn btn-sm bg-base-100 hover:bg-base-200 join-item btn-circle',
          userHasLiked === -1 ? 'bg-red-500 hover:bg-red-600' : 'bg-base-100'
        ]">
          <ArrowBigDown />
        </button>
        <!-- Reply and Edit Buttons -->
        <button class="btn btn-sm bg-base-100 hover:bg-base-200 btn-circle" @click="isReplying = !isReplying">
          <Reply />
        </button>

        <button v-if="authUser?.username === username" class="btn btn-sm bg-base-100 hover:bg-base-200 btn-circle"
          @click="isEditing = !isEditing">
          <Pencil class="w-1 h-1" />
        </button>

        <!-- Delete Button -->
        <button v-if="authUser?.username === username" class="btn btn-sm hover:bg-red-600 btn-circle"
          @click="deleteComment">
          <Trash2 class="w-1 h-1" />
        </button>
      </div>
    </div>
  </div>
      <CommentEditor @cancel="isReplying = false" @success="reload" v-if="isReplying"
      :post-route="`${usePage().url}/comments/`" :parent-comment-id="id" />


  <!-- Replies Section -->
  <div v-if="showReplies && replies?.length" class="pl-12 py-2">
    <CommentNode v-for="reply in replies" :key="reply.id" v-bind="reply" />
  </div>
</template>

<script lang="ts" setup>
import type { SharedProps } from '@adonisjs/inertia/types'
import { router, usePage } from '@inertiajs/vue3'
import axios from 'axios'
import { formatDistanceToNowStrict } from 'date-fns'
import { ArrowBigDown, ArrowBigUp, ChevronDown, ChevronUp, Pencil, Reply, Trash2 } from 'lucide-vue-next'
import { defineAsyncComponent, ref } from 'vue'
import { renderMarkdown } from '~/utils/markdown_formatter'

type SerializedComment = {
  id: number
  content: string
  createdAt: string
  displayName: string
  username: string
  avatarUrl: string
  totalScore?: number
  slug: string
  replies: SerializedComment[]
  userHasLiked: number
}

const { authUser } = usePage<SharedProps>().props
const { slug, totalScore: initialScore, userHasLiked: initialLikeStatus } = defineProps<SerializedComment>()

const emit = defineEmits(['cancel', 'success'])

// Reactive States
const isEditing = ref(false)
const isReplying = ref(false)
const showReplies = ref(false)
const totalScore = ref(initialScore || 0)
const userHasLiked = ref(initialLikeStatus || 0)

const CommentEditor = defineAsyncComponent(() => import('~/components/Post/CommentTree/AsyncCommentEditor.vue'))

const formatDate = (date: string) => formatDistanceToNowStrict(new Date(date), { addSuffix: true })

const url = usePage().url.split('/')
const postSlug = url[4]
const forumName = url[2]

// Handle Upvote
const handleUpVote = async () => {
  if (userHasLiked.value === 1) {
    totalScore.value -= 1
    userHasLiked.value = 0
  } else {
    totalScore.value += userHasLiked.value === -1 ? 2 : 1
    userHasLiked.value = 1
  }

  try {
    await axios.post(`/f/${forumName}/posts/${postSlug}/comments/${slug}/upvote`, {
      commentSlug: slug,
    })
  } catch (error) {
    alert('Failed to upvote comment')
    totalScore.value -= userHasLiked.value === 1 ? 1 : -1
    userHasLiked.value = 0
  }
}

// Handle Downvote
const handleDownVote = async () => {
  if (userHasLiked.value === -1) {
    totalScore.value += 1
    userHasLiked.value = 0
  } else {
    totalScore.value -= userHasLiked.value === 1 ? 2 : 1
    userHasLiked.value = -1
  }

  try {
    await axios.post(`/f/${forumName}/posts/${postSlug}/comments/${slug}/downvote`, {
      commentSlug: slug,
    })
  } catch (error) {
    console.error(error)
    alert('Failed to downvote comment')
    totalScore.value += userHasLiked.value === -1 ? 1 : -1
    userHasLiked.value = 0
  }
}

// Delete Comment
const deleteComment = async () => {
  const confirmed = confirm('Are you sure you want to delete this comment?')
  if (confirmed) {
    try {
      await axios.delete(`/f/${forumName}/posts/${postSlug}/comments/${slug}`)
      reload()
    } catch (error) {
      console.error(error)
      alert('Failed to delete comment')
    }
  }
}

// Reload Comments
const reload = () => {
  isEditing.value = false
  isReplying.value = false
  //router.visit(usePage().url, { only: ['comments'], preserveState: false, preserveScroll: true })
  router.reload({ reset: ['comments'] })
}
</script>
