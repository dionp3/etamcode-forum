<script lang="ts" setup>
import { usePage } from '@inertiajs/vue3'
import {
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
import type { SharedProps } from '@adonisjs/inertia/types'

// Define props to accept forums from BaseLayout
const { authUser } = usePage<SharedProps>().props
</script>

<template>
  <!-- Close button for small screens -->

  <!-- Home & Popular Links -->
  <li>
    <a href="/" class="menu">
      <House class="w-5 h-5" />
      Home
    </a>
  </li>
  <li>
    <a href="/posts" class="menu">
      <ArrowUpWideNarrow class="w-5 h-5" />
      Popular
    </a>
  </li>

  <!-- Collapsible ETAM CODE Section -->
  <li>
    <details open>
      <summary class="font-bold py-2">ETAM CODE</summary>
      <ul class="pl-4">
        <li>
          <a href="#" class="menu">
            <BookOpen class="w-5 h-5" />
            Tes Online
          </a>
        </li>
        <li>
          <a href="#" class="menu">
            <FileText class="w-5 h-5" />
            Kursus
          </a>
        </li>
      </ul>
    </details>
  </li>

  <!-- Collapsible RESOURCES Section -->
  <li>
    <details open>
      <summary class="font-bold py-2">RESOURCES</summary>
      <ul class="pl-4">
        <li>
          <a href="#" class="menu">
            <ScrollText class="w-5 h-5" />
            About Forum
          </a>
        </li>
        <li>
          <a href="#" class="menu">
            <Wallet class="w-5 h-5" />
            Advertise
          </a>
        </li>
        <li>
          <a href="#" class="menu">
            <CircleHelp class="w-5 h-5" />
            Help
          </a>
        </li>
        <li>
          <a href="#" class="menu">
            <Shield class="w-5 h-5" />
            Content Policy
          </a>
        </li>
        <li>
          <a href="#" class="menu">
            <FileLock2 class="w-5 h-5" />
            Privacy Policy
          </a>
        </li>
        <li>
          <a href="#" class="menu">
            <FileText class="w-5 h-5" />
            authUser Agreement
          </a>
        </li>
      </ul>
    </details>
  </li>

  <!-- Forum List -->
  <li>
    <details open>
      <summary class="font-bold py-2">FORUMS</summary>
      <ul class="pl-4">
        <!-- Display followed forums if any -->
        <li v-if="authUser?.followedForums?.length" class="font-bold py-2">Followed Forums</li>
        <li v-for="forum in authUser?.followedForums || []" :key="forum.name" class="flex space-x-4">
          <div class="flex items-center space-x-2">
            <div class="avatar">
              <div class="w-8 rounded-full">
                <img :src="forum.iconUrl" :alt="forum.name" />
              </div>
            </div>
            <Link :href="`/f/${forum.name}`" class="menu">
            {{ forum.name }}
            </Link>
          </div>
        </li>
      </ul>

      <!-- Always Show Buttons for Create Forum and See All Forums -->
      <div class="mt-4 space-y-2">
        <Link href="/f/create" class="btn btn-primary btn-sm w-full text-center">
        Create Forum
        </Link>
        <Link href="/f" class="btn btn-primary btn-sm w-full text-center">
        See All Forums
        </Link>
      </div>
    </details>
  </li>
</template>
