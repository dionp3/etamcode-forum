<script lang="ts">
import { ref } from 'vue'

const Joined = ref(false)
const showFullDesc = ref(false)
const forum = ref([
  {
    name: 'Indonesia',
    desc: 'Lorem ipsum dolor sit amet consectetur, adipisicing elit. Velit repellendus quo fugit doloremque, a iure nam est tempora, harum, quaerat facere ipsa eum culpa natus? Laudantium, itaque cum? Repellendus, aliquam.',
    members: 675000,
    posts: 200000,
    type: 'Public',
  },
])

export default {
  setup() {
    return {
      Joined,
      forum,
      showFullDesc,
    }
  },
}
</script>

<template>
  <div class="w-full p-2 border border-primary rounded-lg">
    <div class="w-full flex flex-col gap-4">
      <div class="flex flex-row place-content-between">
        <div class="flex items-center">
          <h2 class="font-bold text-xl w-full align-middle">{{ forum[0].name }}</h2>
        </div>
        <button v-if="!Joined" @click="Joined = true" class="btn btn-secondary">Join</button>
        <button v-else @click="Joined = false" class="btn btn-outline btn-ghost">Joined</button>
      </div>
      <p :class="{ 'line-clamp-3': !showFullDesc }">
        {{ forum[0].desc }}
      </p>
      <button
        @click="showFullDesc = !showFullDesc"
        class="btn btn-ghost text-secondary font-semibold"
      >
        {{ showFullDesc ? 'See less' : 'See More' }}
      </button>
      <div class="flex flex-row place-content-between">
        <h3 class="basis-0">
          <span class="font-bold">{{ forum[0].members }}</span>
          Members
        </h3>
        <h3 class="basis-0">
          <span class="font-bold">{{ forum[0].posts }}</span>
          Posts
        </h3>
        <h3 class="basis-0">
          <span class="font-bold">{{ forum[0].type }}</span>
          Forum
        </h3>
      </div>
    </div>
  </div>
</template>
