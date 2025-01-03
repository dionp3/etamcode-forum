<template>
  <div class="flex pt-16">
    <aside v-if="isDesktop" class=" w-72 flex-shrink-0 border-r-[1px] border-r-base-300 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto
      pt-3">
      <ul class="menu overflow-y-auto">
        <SideNav />
      </ul>
    </aside>
    <main class="flex flex-col flex-grow items-center min-w-0 w-full py-8">
      <slot />
    </main>
  </div>
  <div class="navbar fixed left-0 top-0 bg-base-100 bg-opacity-75 backdrop-blur border-b-[1px] border-b-base-300 ">
    <NavBar />
  </div>
  <dialog id="search_modal" class="modal">
    <SearchModal />
  </dialog>
  <div v-if="!isDesktop" class="drawer">
    <Drawer>
      <SideNav />
    </Drawer>
  </div>
</template>
<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue'
const Drawer = defineAsyncComponent(() => import('~/components/SideBar/AsyncDrawer.vue'))

// Reactivity for screen size check
const isDesktop = ref(false)

// Setup listener for window resize to check screen size
const checkIfDesktop = () => {
  isDesktop.value = window.innerWidth >= 1024
}

onMounted(() => {
  checkIfDesktop() // Initial check
  window.addEventListener('resize', checkIfDesktop) // Update on resize
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkIfDesktop) // Cleanup listener
})
</script>
