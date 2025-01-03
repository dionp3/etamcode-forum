<template>
  <div class="flex flex-wrap gap-2 items-center">
    <!-- Voting Buttons -->
    <div class="join">
      <button @click.stop="upvote"
        :class="[userVoteScore === 1 ? 'bg-primary text-white' : 'bg-base-200 hover:bg-base-200']"
        class="btn btn-sm join-item rounded-full">
        <ArrowBigUp />
      </button>
      <label class="btn btn-sm bg-base-200 hover:bg-base-200 join-item pointer-events-none">
        {{ totalScore }}
      </label>
      <button @click.stop="downvote"
        :class="[userVoteScore === -1 ? 'bg-primary text-white' : 'bg-base-200 hover:bg-base-200']"
        class="btn btn-sm join-item rounded-full">
        <ArrowBigDown />
      </button>
    </div>

    <!-- Additional Actions -->
    <div class="flex items-center ml-2">
      <!-- Share Button -->
      <div class="dropdown">
        <button class="btn btn-sm bg-base-200 hover:bg-base-200 flex items-center" @click.stop="toggleShareMenu">
          <Share />
        </button>
        <ul v-if="showShareMenu" class="menu bg-base-200 hover:bg-base-200 rounded-full w-52 p-2 shadow mt-2">
          <li>
            <a @click.stop="copyPostLink">
              <Link2 />
              Copy Link
            </a>
          </li>
        </ul>
      </div>

      <!-- Copy Alert -->
      <div v-if="showCopyAlert" class="alert alert-success fixed bottom-5 left-5 max-w-xs p-4">
        <CheckCircle />
        <span>Link copied to clipboard!</span>
      </div>

      <!-- Comment Button -->
      <button class="btn btn-sm bg-base-200 hover:bg-base-200 ml-2" @click="handleComment">
        <MessageSquareText />{{ totalComments }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { router } from '@inertiajs/vue3'
import axios from 'axios'

import { ArrowBigUp, ArrowBigDown, Share, MessageSquareText, Link2, CheckCircle } from 'lucide-vue-next'
import { copyLink } from './share_util'

// Props
const {
  link,
  slug,
  forumName,
  userVoteScore: userVoteScoreProps,
  totalScore: totalScoreProps,
} = defineProps<{
  totalScore: string
  totalComments: string
  link?: string
  slug: string
  forumName?: string
  userVoteScore: number
}>()

// Reactive State
const totalScore = ref<number>(Number.parseInt(totalScoreProps))
const userVoteScore = ref<number>(userVoteScoreProps)
const showShareMenu = ref(false)
const showCopyAlert = ref(false)

// Methods
const upvote = async () => {
  try {
    await axios.post(link ? `${link}/upvote` : `/f/${forumName}/posts/${slug}/upvote`, {
      postSlug: slug,
    })
    if (userVoteScore.value === 1) {
      totalScore.value -= 1
      userVoteScore.value = 0
    } else {
      if (userVoteScore.value === -1) {
        totalScore.value += 2
      } else {
        totalScore.value += 1
      }
      userVoteScore.value = 1
    }
  } catch (error) {
    alert('Failed to upvote the post.')
  }
}

const downvote = async () => {
  try {
    await axios.post(link ? `${link}/downvote` : `/f/${forumName}/posts/${slug}/downvote`, { postSlug: slug })
    if (userVoteScore.value === -1) {
      totalScore.value += 1
      userVoteScore.value = 0
    } else {
      if (userVoteScore.value === 1) {
        totalScore.value -= 2
      } else {
        totalScore.value -= 1
      }
      userVoteScore.value = -1
    }
  } catch (error) {
    alert('Failed to downvote the post.')
  }
}

const handleComment = () => (link ? router.visit(link, {}) : document?.getElementById('comments')?.scrollIntoView())

const copyPostLink = () => {
  copyLink(link || window.location.href)
  showCopyAlert.value = true
  setTimeout(() => {
    showCopyAlert.value = false
  }, 2000)
}

const toggleShareMenu = () => {
  showShareMenu.value = !showShareMenu.value
}
</script>
