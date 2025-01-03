<script setup lang="ts">
import { ref } from 'vue'
const Moderators = ref([
  {
    name: 'Alice Johnson',
    permission: 'Admin',
    edit: true,
    joined: '2023-05-15',
  },
  {
    name: 'Brian Smith',
    permission: 'Moderator',
    edit: false,
    joined: '2022-11-10',
  },
  {
    name: 'Catherine Lee',
    permission: 'Editor',
    edit: true,
    joined: '2023-01-22',
  },
  {
    name: 'Daniel Martinez',
    permission: 'Admin',
    edit: true,
    joined: '2021-08-05',
  },
  {
    name: 'Emily Davis',
    permission: 'Moderator',
    edit: false,
    joined: '2022-02-18',
  },
  {
    name: 'Frank Miller',
    permission: 'Editor',
    edit: true,
    joined: '2023-03-12',
  },
  {
    name: 'Grace Thompson',
    permission: 'Moderator',
    edit: false,
    joined: '2023-07-08',
  },
  {
    name: 'Henry Walker',
    permission: 'Admin',
    edit: true,
    joined: '2020-12-20',
  },
  {
    name: 'Isabelle Perez',
    permission: 'Editor',
    edit: true,
    joined: '2023-06-30',
  },
  {
    name: 'John Kim',
    permission: 'Moderator',
    edit: false,
    joined: '2022-09-15',
  },
])
</script>

<template>
  <div class="flex flex-col gap-10 justify-center items-center">
    <h1 class="text-2xl font-bold">Forum's Moderator</h1>
    <div class="flex flex-col w-1/2">
      <div class="border-y-2 border-neutral w-full p-4">
        <div
          class="border-0 border-b-sm border-solid border-neutral-border group/tablerow border-t-sm text-left flex font-bold"
        >
          <span class="py-md pl-xs w-[50%]">USERNAME</span>
          <span class="py-md pl-xs w-[15%]">PERMISSIONS</span>
          <span class="py-md pl-xs w-[15%]">You can edit</span>
          <span class="py-md pl-xs w-[20%]">JOINED</span>
        </div>
      </div>
      <div
        class="border-b-2 border-neutral w-full p-4"
        v-for="(item, index) in Moderators"
        :key="index"
      >
        <div
          class="border-0 border-b-sm border-solid border-neutral-border group/tablerow border-t-sm text-left flex font-medium"
        >
          <span class="py-md pl-xs w-[50%]">{{ item.name }}</span>
          <span class="py-md pl-xs w-[15%]">{{ item.permission }}</span>
          <span class="py-md pl-xs w-[15%]">{{ item.edit ? 'Yes' : 'No' }}</span>
          <span class="py-md pl-xs w-[20%]">{{ item.joined }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
