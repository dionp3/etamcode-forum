<script setup lang="ts">
import type PostsController from '#controllers/posts_controller'
import type { InferPageProps, SharedProps } from '@adonisjs/inertia/types'
import { ArrowLeft } from 'lucide-vue-next'
import { Deferred, router, usePage, WhenVisible } from '@inertiajs/vue3'
import { defineAsyncComponent, ref } from 'vue'
import type { PaginateMeta } from '~/types'

const { post, comments, paginate } = defineProps<{
  post?: InferPageProps<PostsController, 'show'>['post']
  comments?: InferPageProps<PostsController, 'show'>['comments']
  paginate: PaginateMeta
}>()

const { authUser } = usePage<SharedProps>().props

const isEditing = ref(false)

const CommentEditor = defineAsyncComponent(() => import('~/components/Post/CommentTree/AsyncCommentEditor.vue'))

const goBack = () => window.history.back()

const reload = () => {
  isEditing.value = false
  router.reload({ reset: ['comments'] })
}
</script>

<template>
  <ContentContainer>
    <button @click.prevent="goBack" class="btn btn-ghost btn-sm rounded-full">
      <ArrowLeft />Back
    </button>
    <Deferred data="post">
      <template #fallback>
        <div class="flex w-full flex-col gap-4">
          <div class="flex items-center gap-4">
            <div class="skeleton h-16 w-16 shrink-0 rounded-full"></div>
            <div class="flex flex-col gap-4">
              <div class="skeleton h-4 w-20"></div>
              <div class="skeleton h-4 w-28"></div>
            </div>
          </div>
          <div class="skeleton h-32 w-full"></div>
        </div>
      </template>
      <PostCard :post="post" />
    </Deferred>
    <input v-if="authUser && !isEditing" type="text" class="input input-bordered w-full rounded-full"
      placeholder="Add a comment" @click.prevent="isEditing = true" readonly />
    <CommentEditor v-if="isEditing" @cancel="isEditing = false" @success="reload"
      :post-route="`${usePage().url}/comments`" />
    <div class="divider"></div>
    <Deferred data="comments">
      <template #fallback>
        <div class="text-center">
          <span class="loading loading-dots loading-lg"></span>
        </div>
      </template>
      <div v-if="comments && comments.length > 0" id="comments" class="space-y-2">
        <CommentNode v-for="comment in comments" :key="comment.id" v-bind="comment" @cancel="isEditing = false"
          @success="reload" />
      </div>
      <WhenVisible v-if="paginate.currentPage !== paginate.lastPage" :params="{
        data: { page: paginate.currentPage + 1 },
        only: ['paginate', 'comments']
      }" data="comments" always>
        <div class="text-center">
          <span class="loading loading-dots loading-lg"></span>
        </div>
      </WhenVisible>
    </Deferred>
    <template #side-content>
      <ForumRules/>
    </template>
  </ContentContainer>
</template>
