<script setup lang="ts">
import { X } from 'lucide-vue-next'
</script>

<template>
  <input id="rapli-sidebar" type="checkbox" class="drawer-toggle" />
  <div class="drawer-side">
    <label for="rapli-sidebar" aria-label="close sidebar" class="drawer-overlay"></label>
    <ul class="menu overflow-y-auto min-h-full w-full max-w-80 bg-base-100 divide-y divide-double divide-base-300">
      <div>
        <label for="rapli-sidebar" class="btn btn-md btn-ghost ">
          <X />
        </label>
      </div>
      <SideNav />
    </ul>
  </div>
</template>
