import { reactive, computed, watch } from 'vue'

// Initialize the reactive state for the theme
const modalState = reactive({
  theme: localStorage.getItem('theme') || 'light', // Load from localStorage or default to 'light'
})

// Computed property to determine if the theme is dark
const isDarkTheme = computed(() => modalState.theme === 'dark')

// Watch the theme and update localStorage and the HTML element immediately
watch(
  () => modalState.theme,
  (newValue) => {
    localStorage.setItem('theme', newValue) // Save theme in localStorage
    document.documentElement.setAttribute('data-theme', newValue) // Set the HTML 'data-theme' attribute
  },
  { immediate: true } // Ensure this runs immediately when the component mounts
)

// Function to toggle the theme between dark and light
const toggleTheme = () => {
  modalState.theme = modalState.theme === 'dark' ? 'light' : 'dark' // Toggle between light and dark
}

// Export the reactive state and functions
export { modalState, isDarkTheme, toggleTheme }
