<template>
  <div
    class="p-16 border border-gray-300 text-center"
    @dragover="dragover"
    @dragleave="dragleave"
    @drop="drop"
  >
    <input
      type="file"
      multiple
      name="file"
      id="fileInput"
      class="hidden"
      @change="onChange"
      ref="file"
      accept=".pdf,.jpg,.jpeg,.png"
    />

    <label for="fileInput" class="text-lg cursor-pointer">
      <div v-if="isDragging" class="bg-primary text-primary-content p-4 rounded-lg">
        Release to drop files here.
      </div>
      <div v-else>
        <span class="bg-primary text-primary-content p-4 rounded-lg"
          >Drop files here or <u>click here</u> to upload.</span
        >
      </div>
    </label>

    <div v-if="files.length" class="flex flex-wrap mt-4 gap-2 justify-center">
      <div
        v-for="file in files"
        :key="file.name"
        class="card card-compact w-24 bg-base-200 shadow-lg p-2"
      >
        <figure>
          <img
            class="w-12 h-12 rounded border border-gray-400 bg-gray-400"
            :src="generateThumbnail(file)"
            alt="preview"
          />
        </figure>
        <div class="card-body p-2">
          <p class="text-sm truncate w-20" :title="file.name">{{ makeName(file.name) }}</p>
          <button
            class="btn btn-sm btn-error text-base-content"
            type="button"
            @click="remove(files.indexOf(file))"
            title="Remove file"
          >
            &times;
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'

const isDragging = ref(false)
const files = reactive<File[]>([])

const onChange = () => {
  const fileInput = document.getElementById('fileInput') as HTMLInputElement
  if (fileInput?.files) {
    files.push(...Array.from(fileInput.files))
  }
}

const generateThumbnail = (file: File): string => {
  const fileSrc = URL.createObjectURL(file)
  setTimeout(() => {
    URL.revokeObjectURL(fileSrc)
  }, 1000)
  return fileSrc
}

const makeName = (name: string): string => {
  return name.split('.')[0].substring(0, 3) + '...' + name.split('.').pop()
}

const remove = (index: number) => {
  files.splice(index, 1)
}

const dragover = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = true
}

const dragleave = () => {
  isDragging.value = false
}

const drop = (e: DragEvent) => {
  e.preventDefault()
  if (e.dataTransfer?.files) {
    files.push(...Array.from(e.dataTransfer.files))
  }
  isDragging.value = false
}
</script>
