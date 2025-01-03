<template>
  <div class="flex justify-between">
    <div class="flex items-center space-x-2">
      <!-- Avatar -->
      <div class="avatar shrink-0">
        <div class="w-8 h-8 rounded-full">
          <img :src="avatarUrl" alt="Avatar" />
        </div>
      </div>

      <!-- Forum Name -->
      <Link v-if="forumName" class="text-sm font-medium" :href="`/f/${forumName}`">{{ forumName }}
      </Link>
      <span v-if="forumName" class="text-sm text-base-content">•</span>

      <!-- Username/Display Name -->
      <Link v-if="username" class="text-sm text-base-content" :href="`/u/${username}`">{{ displayName || `u/${username}`
      }}
      </Link>
      <span v-if="username" class="text-sm text-base-content">•</span>
      <span class="text-sm text-base-content">{{ formatDistanceToNow(createdAt, { addSuffix: true }) }}</span>
    </div>
    <div v-if="authUser && authUser.username === username" class="dropdown">
      <div tabindex="0" role="button" class="btn btn-circle  btn-xs">
        <Ellipsis />
      </div>
      <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
        <li>
          <Link :href="link ? `${link}/edit` : `${usePage().url}/edit`">
          <Edit />
          Edit
        </Link>
        </li>
        <li>
          <a @click.stop="handleDelete">
            <Trash />
            Delete
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SharedProps } from '@adonisjs/inertia/types'
import { usePage } from '@inertiajs/vue3'
import { formatDistanceToNow } from 'date-fns'
import { Edit, Ellipsis, Trash } from 'lucide-vue-next'
import axios from 'axios'
import { router } from '@inertiajs/vue3'

const emit = defineEmits(['delete'])

const handleDelete = async () => {
  try {
    await axios.delete(link ? link : usePage().url)
    emit('delete')
    router.get(`/f/${forumName}`)
  } catch (error) {
    alert('Failed to delete the post.')
  }
}
const { authUser } = usePage<SharedProps>().props

const { link, forumName, avatarUrl, username, displayName, createdAt } = defineProps<{
  link?: string
  avatarUrl: string
  forumName?: string
  username?: string
  displayName?: string
  createdAt: string
}>()
</script>
