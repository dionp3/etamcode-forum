<script lang="ts" setup>
import { useForm } from '@inertiajs/vue3'
import { modalState } from '~/store/modal_state'
import { Mail, KeyRound } from 'lucide-vue-next'
import { formatErrors } from './formatErrors'
import { z } from 'zod'
import { reactive, onMounted, computed } from 'vue'
import { usePage } from '@inertiajs/vue3'
import VueTurnstile from 'vue-turnstile'

const page = usePage()
const turnstileSiteKey = computed(() => page.props.turnstileSiteKey)
console.log(page.props)
// Definisikan schema validasi Zod
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

onMounted(() => {
  // Check if the Turnstile script is already present
  if (
    !document.querySelector('script[src="https://challenges.cloudflare.com/turnstile/v0/api.js"]')
  ) {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  }
})

// Inertia Form
const form = useForm({
  email: '',
  password: '',
  token: '',
})

// State untuk menyimpan pesan kesalahan dari Zod
const zodErrors = reactive<{ email?: string; password?: string }>({})

const siteKey = turnstileSiteKey.value
console.log(siteKey)

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
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-3">
    <!-- Input Email -->
    <label class="input input-bordered flex items-center gap-2">
      <Mail />
      <input type="text" class="grow" placeholder="Email" v-model="form.email" />
    </label>
    <div v-if="zodErrors.email || form.errors.email" class="text-sm mb-4 text-red-400">
      <!-- Prioritaskan kesalahan Zod jika ada -->
      {{ zodErrors.email || formatErrors(form.errors.email) }}
    </div>

    <!-- Input Password -->
    <label class="input input-bordered flex items-center gap-2">
      <KeyRound />
      <input
        type="password"
        class="grow"
        value="password"
        placeholder="Password"
        v-model="form.password"
      />
    </label>
    <div v-if="zodErrors.password || form.errors.password" class="text-sm mb-4 text-red-400">
      {{ zodErrors.password || formatErrors(form.errors.password) }}
    </div>

    <vue-turnstile v-bind:site-key="siteKey" v-model="form.token" />

    <p class="text-sm my-4">
      New on EtamCode?
      <a class="link" @click="modalState.value = 'Register'">Register</a>
    </p>

    <!-- Tombol Submit -->
    <button type="submit" :disabled="form.processing" class="btn btn-block rounded-full">
      Login
    </button>
  </form>
</template>
