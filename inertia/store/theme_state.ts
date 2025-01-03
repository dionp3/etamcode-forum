import { ref, computed } from 'vue'

type Theme = 'light' | 'dark'

// Helper to determine if code is running on the client
const isClient = typeof window !== 'undefined' && typeof document !== 'undefined'

// Reactive theme state
const theme = ref<Theme>(isClient ? (document.documentElement.getAttribute('data-theme') as Theme) || 'light' : 'light')

// Computed property to manage dark theme
export const isDarkTheme = computed({
  get: () => theme.value === 'dark',
  set: (value: boolean) => {
    if (!isClient) return
    theme.value = value ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme.value)
    localStorage.setItem('theme', theme.value)
  },
})
