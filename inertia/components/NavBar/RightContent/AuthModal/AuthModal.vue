<script lang="ts" setup>
import { Link } from '@inertiajs/vue3';
</script>

<template>
  <!-- You can open the modal using htmlID.showModal() method -->
  <button class="btn btn-primary text-gray-100 rounded-full">
    <Link href="auth/login" >
      Login
    </Link>
  </button>
  <!-- <dialog id="auth_modal" class="modal">
    <div class="modal-box gap-y-5 bg-base-200">
      <h2 class="text-xl font-bold">{{ modalState.value }}</h2>
      <button class="btn btn-block rounded-full">
        <img
          class="w-6 h-6"
          src="https://www.svgrepo.com/show/475656/google-color.svg"
          loading="lazy"
          alt="google logo"
        />
        <a href="/auth/google/redirect">
          <span>{{ modalState.value }} with Google</span>
        </a>
      </button>
      <div class="divider">OR</div>
      <Register v-if="modalState.value === 'Register'" />
      <Login v-if="modalState.value === 'Login'" />
      <ForgotPassword v-if="modalState.value === 'Forgot Password'" />

      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
          <X />
        </button>
      </form>
    </div>
  </dialog> -->
</template>
