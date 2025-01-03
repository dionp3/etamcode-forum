<script setup lang="ts">
import { ref, computed } from 'vue'
import { Star } from 'lucide-vue-next'
import { Plus } from 'lucide-vue-next'
import { usePage } from '@inertiajs/vue3'

const page = usePage()
const isAuth = computed(() => page.props.isAuth)

const forum = ref([
  {
    Image:
      'https://media.istockphoto.com/id/1521180915/vector/garuda-indonesia-logo-design-vector.jpg?s=612x612&w=0&k=20&c=SDgobdVgr46Kkh36lppQTdW0x9ZBtHxkMnBwMkKkIhc=',
    name: 'Indonesia',
    members: '675000 Members',
  },
  {
    Image: 'https://seeklogo.com/images/A/amd-logo-59E15B5EB9-seeklogo.com.png',
    name: 'AMD',
    members: '2000000 Members',
  },
  {
    Image: 'https://miro.medium.com/v2/resize:fit:1200/1*-8AAdexfOAK9R-AIha_PBQ.png',
    name: 'vue.js',
    members: '110000 Members',
  },
  {
    Image:
      'https://styles.redditmedia.com/t5_2qs0q/styles/communityIcon_kxcmzy9bt1381.jpg?format=pjpg&s=16025192cd7824a5f93aaa0ed9eb4f149761e18e',
    name: 'webdev',
    members: '2600000 Members',
  },
])
</script>

<template>
  <div class="w-full p-2 border border-primary rounded-lg">
    <h2 class="font-bold text-xl">
      {{ isAuth ? 'Communities' : 'Popular Communities' }}
    </h2>
    <div class="flex flex-col gap-4 mt-4">
      <div
        v-for="(item, index) in forum"
        :key="index"
        class="flex gap-4 items-center w-full h-fit p-2 rounded-lg hover:bg-neutral hover:text-neutral-content hover:cursor-pointer"
      >
        <div class="w-12 aspect-square">
          <img
            v-if="item.Image !== null"
            :src="item.Image"
            alt="Forum Image"
            class="w-full h-full object-cover rounded-lg"
          />
          <div v-else class="bg-gray-500 w-full h-full flex items-center justify-center rounded-lg">
            32 x 32
          </div>
        </div>
        <div class="flex flex-col justify-center w-fit h-fit">
          <p v-if="item.name == null" class="text-lg font-semibold">Forum's Name</p>
          <p v-else class="text-lg font-semibold">{{ item.name }}</p>
          <div v-show="!isAuth">
            <p v-if="item.members == null" class="whitespace-nowrap">Forum's Members</p>
            <p v-else class="whitespace-nowrap">{{ item.members }}</p>
          </div>
        </div>
        <div v-show="isAuth" class="ml-auto flex place-content-end">
          <Star />
        </div>
      </div>
      <div v-if="!isAuth" class="text-sm font-medium text-secondary hover:cursor-pointer">
        show more
      </div>
      <div v-else class="btn btn-ghost flex flex-row gap-4 hover:cursor-pointer">
        <Plus />
        <p>Create community</p>
      </div>
    </div>
  </div>
</template>
