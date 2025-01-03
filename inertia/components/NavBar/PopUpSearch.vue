<script lang="ts" setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  searchQuery: String,
})

const searchResults = ref([
  { name: 'r/KingOfTheHill', members: '333K anggota' },
  { name: 'r/kingdomcome', members: '216K anggota' },
  { name: 'r/KingdomHearts', members: '337K anggota' },
  { name: 'r/kings', members: '204K anggota' },
  { name: 'r/Kingdom', members: '89K anggota' },
])

const isDropdownVisible = ref(false)

// Filter hasil pencarian berdasarkan teks input
const filteredResults = computed(() => {
  if (!props.searchQuery) {
    return []
  }
  return searchResults.value.filter((result) =>
    result.name.toLowerCase().includes(props.searchQuery.toLowerCase())
  )
})

// Menampilkan dropdown jika ada hasil pencarian
watch(
  () => props.searchQuery,
  (newQuery) => {
    isDropdownVisible.value = newQuery.length > 0 && filteredResults.value.length > 0
  }
)
</script>

<template>
  <div
    v-if="isDropdownVisible"
    class="absolute mt-1 w-full rounded-lg shadow-lg border-2 border-gray-300 bg-white z-10"
  >
    <ul class="list-none p-0">
      <li
        v-for="result in filteredResults"
        :key="result.name"
        class="flex items-center p-3 border-b last:border-none hover:bg-gray-200 transition-colors duration-150"
      >
        <div class="flex flex-col">
          <span class="font-semibold text-black">{{ result.name }}</span>
          <span class="text-sm text-gray-600">{{ result.members }}</span>
        </div>
      </li>
    </ul>
    <!-- Jika tidak ada hasil pencarian -->
    <div v-if="filteredResults.length === 0" class="p-3 text-center text-gray-500">
      Tidak ada hasil ditemukan
    </div>
  </div>
</template>
