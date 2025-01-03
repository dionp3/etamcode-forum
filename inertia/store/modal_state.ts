import { reactive } from 'vue'
export type ModalType = 'Login' | 'Register'

export const modalState = reactive<{
  value: ModalType
}>({
  value: 'Login',
})
