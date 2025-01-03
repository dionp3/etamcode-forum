<!-- Navbar.vue -->
<script lang="ts" setup>
import { Menu } from 'lucide-vue-next'
import { Link } from '@inertiajs/vue3'
</script>
<template>
  <div class="navbar fixed z-10 bg-base-200 border-b-2 border-b-base-300 px-4">
    <div class="navbar-start">
      <label for="rapli-sidebar" class="btn btn-ghost drawer-button lg:hidden">
        <Menu />
      </label>
      <Link href="/" replace>
        <EtamCodeForumLogo class="size-9" />
      </Link>
      <Link href="/" replace>
        <EtamCodeForumText class="w-20 h-9 text-base hidden md:block" />
      </Link>
    </div>
    <div class="navbar-center gap-2 hidden sm:block">
      <SearchInput />
    </div>

    <div class="navbar-end gap-2">
      <!-- Popup Search (hidden on small screens if already integrated in the navbar center) -->

      <!-- Theme Switcher -->
      <ThemeSwitcher />
      <RightContent />
    </div>
  </div>
</template>
