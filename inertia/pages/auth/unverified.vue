<template>
  <div class="flex items-center justify-center h-screen">
    <div class="text-center">
      <h1 class="text-3xl font-bold text-base-content">Verifikasi Email</h1>
      <p class="text-base-content mt-2">
        Email verifikasi telah dikirim ke <span class="font-semibold">{{ email }}</span>.
      </p>
      <p class="text-base-content mt-2">
        Silakan cek email Anda untuk verifikasi akun.
      </p>
    </div>
  </div>
</template>
<script lang="ts" setup>
defineProps<{ email: string }>()
</script>
