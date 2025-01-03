<template>
  <div
    class="border-dashed border-2 border-gray-300 p-6 rounded-lg cursor-pointer hover:bg-gray-100 text-center"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
    @click="handleClick"
  >
    <input
      ref="fileInput"
      type="file"
      class="hidden"
      accept=".jpg,.jpeg,.png,.pdf"
      @change="handleFile"
    />
    <p v-if="fileName" class="text-gray-700">{{ fileName }}</p>
    <p v-else class="text-gray-500">Drop file here or click to upload</p>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

defineProps({ modelValue: String })
const emit = defineEmits(['update:modelValue'])

const fileName = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const handleClick = () => {
  fileInput.value?.click()
}

const handleFile = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files?.[0]) {
    const file = target.files[0]
    fileName.value = file.name
    emit('update:modelValue', URL.createObjectURL(file))
  }
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  const file = e.dataTransfer?.files[0]
  if (file) {
    fileName.value = file.name
    emit('update:modelValue', URL.createObjectURL(file))
  }
  isDragging.value = false
}
</script>

<style scoped>
.border-dashed {
  border-style: dashed;
}
</style>
