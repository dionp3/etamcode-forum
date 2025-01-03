<script setup lang="ts">
// import { ref, computed, watch } from 'vue'
import { router, useForm, usePage } from '@inertiajs/vue3'
const props = defineProps<{
  user: {
    username: string
  }
}>()
// console.log(props.user.username)
const form = useForm({
  displayName: null,
  bio: null,
  imageUrl: null,
})
</script>

<template>
  <div class="flex flex-col gap-10 p-10 w-full items-center">
    <div class="flex flex-col gap-10 border border-primary p-5 rounded-xl w-full max-w-screen-lg">
      <h2 class="font-bold text-xl text-left">Edit Profile</h2>
      <form @submit.prevent="form.put(`/u/${props.user.username}`)">
        <div class="flex flex-col gap-1">
          <h3 class="text-base pb-1">Display Name</h3>
          <input
            v-model="form.displayName"
            id="displayName"
            placeholder="Display Name"
            class="p-5 rounded-lg bg-neutral"
          />
        </div>

        <div class="flex flex-col gap-1">
          <h3 class="text-base pb-1">Bio</h3>
          <textarea
            v-model="form.bio"
            id="bio"
            placeholder="Tell us little bit about yourself! (You can use Markdown)"
            class="p-5 rounded-lg bg-neutral"
          ></textarea>
        </div>

        <div class="flex flex-col gap-1">
          <h3 class="text-base pb-1">Avatar</h3>
          <input id="imageFile" type="file" @change="form.imageUrl = $event.target.files[0]" />
        </div>

        <button type="submit" class="btn btn-primary w-1/5" :disabled="form.processing">
          Update Profile
        </button>
      </form>
    </div>
  </div>
</template>
