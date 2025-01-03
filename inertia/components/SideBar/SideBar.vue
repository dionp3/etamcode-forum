<script setup lang="ts">
import { X } from 'lucide-vue-next'
</script>

<template>
  <div class="drawer">
    <input id="rapli-sidebar" type="checkbox" class="drawer-toggle" />
    <div class="drawer-side z-20">
      <label for="rapli-sidebar" aria-label="close sidebar" class="drawer-overlay"></label>
      <ul class="menu overflow-y-auto min-h-full w-full max-w-80 bg-base-100">
        <div>
          <label for="rapli-sidebar" class="btn btn-ghost lg:hidden">
            <X />
          </label>
        </div>
        <div class="divider lg:hidden"></div>
        <SideNav />
      </ul>
    </div>
  </div>
</template>
