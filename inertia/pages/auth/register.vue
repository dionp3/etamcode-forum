<script setup lang="ts">
import { useForm } from '@inertiajs/vue3'
import { KeyRound, Mail, User } from 'lucide-vue-next'
import { reactive } from 'vue'
import VueTurnstile from 'vue-turnstile'
import { z } from 'zod'
import { formatErrors } from '~/utils/formatErrors'

defineProps<{ turnstileSiteKey: string }>()

// Define Zod validation schema
const registerSchema = z
  .object({
    username: z.string().min(3, { message: 'Username minimal 3 karakter' }),
    email: z.string().email({ message: 'Email tidak valid' }),
    password: z.string().min(8, { message: 'Password minimal 8 karakter' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Password tidak cocok',
  })

// Inertia Form
const form = useForm({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  turnstileToken: '',
})

// State for storing Zod validation errors
const zodErrors = reactive<{
  username?: string
  email?: string
  password?: string
  confirmPassword?: string
}>({})

// Function to validate with Zod before submitting
const handleSubmit = async () => {
  // Reset Zod errors
  zodErrors.username = ''
  zodErrors.email = ''
  zodErrors.password = ''
  zodErrors.confirmPassword = ''

  try {
    // Validate form inputs with Zod
    registerSchema.parse(form.data())
    // If validation passes, proceed with Inertia post
    form.post('/auth/register')
  } catch (e) {
    // Capture Zod errors and store in state
    if (e instanceof z.ZodError) {
      for (const error of e.errors) {
        const field = error.path[0] as 'email' | 'username' | 'password' | 'confirmPassword'
        zodErrors[field] = error.message
      }
    }
  }
}
</script>

<template>
  <div class="flex min-h-screen">
    <!-- ART section -->
    <div class="hidden lg:flex basis-2/3 items-center justify-center">
      <img src="/resources/images/Bg.webp" alt="" class="object-cover w-full h-full" />
    </div>

    <!-- Register Section -->
    <div class="w-full lg:w-96 bg-base-300 basis-1/3 flex flex-col py-10 px-6 space-y-6">
      <div class="flex justify-between w">
        <!-- Logo -->
        <div class="flex flex-row">
          <EtamCodeForumLogo class="size-9 mx-2" />
          <EtamCodeForumText class="w-20 h-9 text-base hidden md:block" />
        </div>
        <ThemeSwitcher />
      </div>

      <!-- Register Form -->
      <form @submit.prevent="handleSubmit" class="space-y-3">

        <!-- Username Input -->
        <label class="input input-bordered flex items-center gap-2">
          <User />
          <input type="text" class="grow" placeholder="Username" v-model="form.username" />
        </label>
        <div v-if="form.errors.username || zodErrors.username" class="text-sm mb-4 text-red-400">
          {{ formatErrors(form.errors.username) || zodErrors.username }}
        </div>

        <!-- Email Input -->
        <label class="input input-bordered flex items-center gap-2">
          <Mail />
          <input type="text" class="grow" placeholder="Email" v-model="form.email" />
        </label>
        <div v-if="form.errors.email || zodErrors.email" class="text-sm mb-4 text-red-400">
          {{ formatErrors(form.errors.email) || zodErrors.email }}
        </div>

        <!-- Password Input -->
        <label class="input input-bordered flex items-center gap-2">
          <KeyRound />
          <input type="password" class="grow" placeholder="Password" v-model="form.password" />
        </label>
        <div v-if="form.errors.password || zodErrors.password" class="text-sm mb-4 text-red-400">
          {{ formatErrors(form.errors.password) || zodErrors.password }}
        </div>

        <!-- Confirm Password Input -->
        <label class="input input-bordered flex items-center gap-2">
          <KeyRound />
          <input type="password" class="grow" placeholder="Confirm Password" v-model="form.confirmPassword" />
        </label>
        <div v-if="zodErrors.confirmPassword" class="text-sm mb-4 text-red-400">
          {{ zodErrors.confirmPassword }}
        </div>

        <vue-turnstile :site-key="turnstileSiteKey" v-model="form.turnstileToken" />
        <div v-if="form.errors.turnstileToken" class="text-sm text-red-400">
          {{ form.errors.turnstileToken }}
        </div>

        <button type="submit" :disabled="form.processing" class="btn btn-primary w-full rounded-full">

          <span v-if="form.progress" class="loading loading-spinner loading-sm"></span>
          <span v-else>Register</span>
        </button>
      </form>

      <!-- Link to Login -->
      <div class="text-center">
        <p class="text-sm">
          Already have an account?
          <Link href="/auth/login" class="text-primary font-bold">Login</Link>
        </p>
      </div>
    </div>
  </div>
</template>
