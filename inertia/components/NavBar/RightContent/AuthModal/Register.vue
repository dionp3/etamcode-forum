<script lang="ts" setup>
import { useForm } from '@inertiajs/vue3'
import { modalState } from '~/store/modal_state'
import { Mail, User, KeyRound } from 'lucide-vue-next'
import { formatErrors } from './formatErrors'
import { z } from 'zod'
import { reactive } from 'vue'

// Definisikan schema validasi Zod
const registerSchema = z.object({
  email: z.string().email({ message: 'Email tidak valid' }),
  username: z.string().min(3, { message: 'Username minimal 3 karakter' }),
  password: z.string().min(8, { message: 'Password minimal 8 karakter' }),
})

// Inertia Form
const form = useForm({
  email: '',
  username: '',
  password: '',
})

// State untuk menyimpan pesan kesalahan dari Zod
let zodErrors = reactive<{ email?: string; username?: string; password?: string }>({})

// Fungsi untuk melakukan validasi dengan Zod sebelum submit
const handleSubmit = async () => {
  // Reset error Zod
  zodErrors.email = ''
  zodErrors.username = ''
  zodErrors.password = ''

  try {
    // Validasi input form dengan Zod
    registerSchema.parse(form.data())
    // Jika validasi berhasil, lanjutkan dengan Inertia post
    form.post('/auth/register')
  } catch (e) {
    // Tangkap kesalahan dari Zod dan simpan dalam state
    if (e instanceof z.ZodError) {
      for (const error of e.errors) {
        const field = error.path[0] as 'email' | 'username' | 'password'
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
      {{ zodErrors.email || formatErrors(form.errors.email) }}
    </div>

    <!-- Input Username -->
    <label class="input input-bordered flex items-center gap-2">
      <User />
      <input type="text" class="grow" placeholder="Username" v-model="form.username" />
    </label>
    <div v-if="zodErrors.username || form.errors.username" class="text-sm mb-4 text-red-400">
      {{ zodErrors.username || formatErrors(form.errors.username) }}
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

    <p class="text-sm my-4">
      Already an EtamCode User?
      <a class="link" @click="modalState.value = 'Login'">Login</a>
    </p>

    <button
      type="submit"
      :disabled="form.processing"
      class="btn btn-block bg-base-100 rounded-full"
    >
      Register
    </button>
  </form>
</template>
