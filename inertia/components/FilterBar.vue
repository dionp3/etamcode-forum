<script lang="ts" setup>
import { Star, Flame, TrendingUp, Megaphone, Layout } from 'lucide-vue-next'
</script>

<template>
  <div class="bg-base-200 rounded-box">
    <ul class="menu lg:menu-horizontal text-sm">
      <li>
        <Link href="">
        <Star />
        Best
        </Link>
      </li>
      <li>
        <Link href="">
        <Flame />
        Hot
        </Link>
      </li>
      <li>
        <Link href="">
        <Megaphone />
        New
        </Link>
      </li>
      <li>
        <Link href="">
        <TrendingUp />
        Top
        </Link>
      </li>

      <!-- Dropdown using <details> -->
      <li>
        <details>
          <summary>
            <Layout />
            More
          </summary>
          <ul class="rounded-box">
            <li>
              <Link href="#">Item 1</Link>
            </li>
            <li>
              <Link href="#">Item 2</Link>
            </li>
          </ul>
        </details>
      </li>
    </ul>
  </div>
</template>
<style lang="postcss" scoped>
.lucide {
  @apply w-4 h-4;
}
</style>
