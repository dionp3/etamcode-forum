<template>
  <!-- Wrapper for Banner, Main Content, and Right Sidebar -->
  <div class="flex flex-col w-full max-w-6xl gap-2">
    <!-- Banner Section -->
    <header v-if="$slots['banner-content']" class="w-full">
      <slot name="banner-content"></slot>

    </header>

    <!-- Main Content and Right Sidebar Container -->
    <div class="flex flex-grow gap-2">
      <!-- Main Content Area (70%) -->
      <main class="flex-grow min-w-0 space-y-2" :class="{ 'basis-9/12': $slots['side-content'] }">
        <slot></slot>
      </main>
      <!-- Right Sidebar (30%) -->
      <aside v-if="$slots['side-content']"
        class="basis-3/12 border-l-base-300 sticky top-20 h-full  overflow-y-auto  min-w-0 divide-y-8 divide-base-300 hidden md:block lg:block xl:blcok 2xl:block">
        <slot name="side-content"></slot>
      </aside>
    </div>
  </div>
</template>
