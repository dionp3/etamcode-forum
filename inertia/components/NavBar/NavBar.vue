<script lang="ts" setup>
import { Menu, Search } from 'lucide-vue-next'
</script>
<template>
  <div class="navbar-start">
    <label for="rapli-sidebar" class="btn btn-ghost drawer-button lg:hidden">
      <Menu class="stroke-gray-700" />
    </label>
    <Link href="/" replace class="flex flex-row">
    <EtamCodeForumLogo class="size-9" />
    <EtamCodeForumText class="w-20 h-9 text-base hidden md:block" />
    </Link>
  </div>
  <div class="navbar-center gap-2 hidden sm:block">
    <label class="input input-bordered flex items-center gap-2" onclick="search_modal.showModal()">
      <Search class="stroke-gray-500" />
      <input type="text" class="grow placeholder-gray-500" placeholder="Search" readonly />
      <kbd class="kbd kbd-sm text-gray-500">ctrl</kbd>
      <kbd class="kbd kbd-sm text-gray-500">k</kbd>
    </label>
  </div>
  <div class="navbar-end gap-2">
    <button class="btn btn-ghost block sm:hidden" onclick="search_modal.showModal()">
      <Search class="stroke-gray-700" />
    </button>
    <ThemeSwitcher />
    <RightContent />
  </div>
</template>
