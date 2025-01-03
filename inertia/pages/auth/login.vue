<script setup lang="ts">
import { Link } from '@inertiajs/vue3'
import AuthLayout from '~/layouts/AuthLayout.vue'
import { useForm, usePage } from '@inertiajs/vue3'
import { Mail, KeyRound } from 'lucide-vue-next'
import { formatErrors } from '../../components/NavBar/RightContent/AuthModal/formatErrors'
import { z } from 'zod'
import { computed, reactive } from 'vue'
import VueTurnstile from 'vue-turnstile'

const page = usePage()
const turnstileSiteKey = computed(() => page.props.turnstileSiteKey as string)
const errors = computed(() => page.props.errors as unknown as string)

// Definisikan schema validasi Zod
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

// Inertia Form
const form = useForm({
  email: '',
  password: '',
  turnstileToken: '',
})

// State untuk menyimpan pesan kesalahan dari Zod
const zodErrors = reactive<{ email?: string; password?: string }>({})

// Fungsi untuk melakukan validasi dengan Zod sebelum submit
const handleSubmit = async () => {
  // Reset error Zod
  zodErrors.email = ''
  zodErrors.password = ''

  try {
    // Validasi input form dengan Zod
    loginSchema.parse(form.data())
    // Jika validasi berhasil, lanjutkan dengan Inertia post
    form.post('/auth/login')
  } catch (e) {
    // Tangkap kesalahan dari Zod dan simpan dalam state
    if (e instanceof z.ZodError) {
      for (const error of e.errors) {
        const field = error.path[0] as 'email' | 'password'
        zodErrors[field] = error.message
      }
    }
  }
}

defineOptions({ layout: AuthLayout })
</script>

<template>
  <div class="flex justify-center items-center min-h-screen bg-base-100">
    <!-- Form Container -->
    <div class="space-y-4 bg-base-200 shadow-md rounded-lg p-6 w-full max-w-md">
      <!-- Header Section (Logo and ThemeSwitcher) -->
      <div class="flex flex-row justify-between mx-2">
        <div class="flex flex-row">
          <EtamCodeForumLogo class="size-9" />
          <EtamCodeForumText class="w-20 h-9 text-base hidden md:block" />
        </div>
        <ThemeSwitcher />
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleSubmit" class="space-y-4 w-full max-w-md">
        <!-- Input Email -->
        <label class="input input-bordered flex items-center gap-2 w-full">
          <Mail />
          <input type="text" class="grow w-full" placeholder="Email" v-model="form.email" />
        </label>
        <div v-if="zodErrors.email || form.errors.email" class="text-sm text-red-400">
          <!-- Prioritaskan kesalahan Zod jika ada -->
          {{ zodErrors.email || formatErrors(form.errors.email) }}
        </div>

        <!-- Input Password -->
        <label class="input input-bordered flex items-center gap-2 w-full">
          <KeyRound />
          <input
            type="password"
            class="grow w-full"
            placeholder="Password"
            v-model="form.password"
          />
        </label>
        <div v-if="zodErrors.password || form.errors.password" class="text-sm text-red-400">
          {{ zodErrors.password || formatErrors(form.errors.password) }}
        </div>

        <!-- Forgot Password & Register Link -->
        <p class="text-sm my-4 text-center">
          Forgot your password?
          <a href="/auth/reset-password" class="link text-primary font-bold">Reset it here</a>
        </p>

        <vue-turnstile :site-key="turnstileSiteKey" v-model="form.turnstileToken" />
        <div v-if="errors === 'Captcha verification failed.'" class="text-sm text-red-400">
          {{ errors }}
        </div>
        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="form.processing"
          class="btn btn-primary btn-block rounded-full w-full"
        >
          <span v-if="form.progress" class="loading loading-spinner loading-sm"></span>
          <span v-else>Login</span>
        </button>

        <!-- Login with Google -->
        <button
          class="btn btn-outline btn-block rounded-full w-full flex items-center justify-center gap-2"
        >
          <img
            class="w-6 h-6"
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            loading="lazy"
            alt="google logo"
          />
          <a href="/auth/google/redirect" class="inline-block">
            <span>Login with Google</span>
          </a>
        </button>

        <!-- Register Link -->
        <div class="text-center">
          <p class="text-sm">
            Don't have an account?
            <Link href="/auth/register" class="text-primary font-bold">Register</Link>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>
