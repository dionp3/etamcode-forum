<script lang="ts" setup>
import { Link } from '@inertiajs/vue3'
import {
  X,
  House,
  ArrowUpWideNarrow,
  ScrollText,
  Wallet,
  CircleHelp,
  Shield,
  FileLock2,
  FileText,
  BookOpen,
} from 'lucide-vue-next'
import type Forum from '#models/forum'

// Define props to accept forums from BaseLayout
const props = defineProps<{
  forums: Forum[]
}>()
</script>

<template>
  <ul class="menu overflow-y-auto">
    <!-- Close button for small screens -->
    <label for="rapli-sidebar" class="btn btn-circle drawer-button lg:hidden">
      <X />
    </label>
    <div class="divider lg:hidden"></div>

    <!-- Home & Popular Links -->
    <li>
      <a href="/" class="menu rounded-lg">
        <House class="w-5 h-5" />
        Home
      </a>
    </li>
    <li>
      <a href="/posts" class="menu rounded-lg">
        <ArrowUpWideNarrow class="w-5 h-5" />
        Popular
      </a>
    </li>

    <div class="divider"></div>

    <!-- Collapsible ETAM CODE Section -->
    <li>
      <details open>
        <summary class="font-bold py-2">ETAM CODE</summary>
        <ul class="pl-4">
          <li>
            <a href="#" class="menu py-2 px-3 rounded-lg">
              <BookOpen class="w-5 h-5" />
              Tes Online
            </a>
          </li>
          <li>
            <a href="#" class="menu py-2 px-3 rounded-lg">
              <FileText class="w-5 h-5" />
              Kursus
            </a>
          </li>
        </ul>
      </details>
    </li>

    <div class="divider"></div>

    <!-- Collapsible RESOURCES Section -->
    <li>
      <details open>
        <summary class="font-bold py-2">RESOURCES</summary>
        <ul class="pl-4">
          <li>
            <a href="#" class="menu py-2 px-3 rounded-lg">
              <ScrollText class="w-5 h-5" />
              About Forum
            </a>
          </li>
          <li>
            <a href="#" class="menu py-2 px-3 rounded-lg">
              <Wallet class="w-5 h-5" />
              Advertise
            </a>
          </li>
          <li>
            <a href="#" class="menu py-2 px-3 rounded-lg">
              <CircleHelp class="w-5 h-5" />
              Help
            </a>
          </li>
          <li>
            <a href="#" class="menu py-2 px-3 rounded-lg">
              <Shield class="w-5 h-5" />
              Content Policy
            </a>
          </li>
          <li>
            <a href="#" class="menu py-2 px-3 rounded-lg">
              <FileLock2 class="w-5 h-5" />
              Privacy Policy
            </a>
          </li>
          <li>
            <a href="#" class="menu py-2 px-3 rounded-lg">
              <FileText class="w-5 h-5" />
              User Agreement
            </a>
          </li>
        </ul>
      </details>
    </li>

    <div class="divider"></div>

    <!-- Forum List -->
    <li>
      <details open>
        <summary class="font-bold py-2">FORUMS</summary>
        <ul class="pl-4">
          <li v-for="forum in props.forums" :key="forum.id">
            <Link :href="`/f/${forum.name}`" class="menu py-2 px-3 rounded-lg">
              {{ forum.name }}
            </Link>
          </li>
        </ul>
      </details>
    </li>
  </ul>
</template>
