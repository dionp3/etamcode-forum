import { reactive } from 'vue'
export type ModalType = 'Login' | 'Register' | 'Forgot Password'

export const modalState = reactive<{
  value: ModalType
}>({
  value: 'Login',
})
