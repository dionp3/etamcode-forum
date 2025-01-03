import type User from '#models/user'
import { loginValidator } from '#validators/auth'
import type { HttpContext } from '@adonisjs/core/http'
import { FirestoreService } from '#services/firestore_service'

export default class LoginController {
  async store({ request, response, auth, session }: HttpContext) {
    try {
      const data = await request.validateUsing(loginValidator)
      let user: User | null = null
      if ('email' in data) {
        const firestoreService = new FirestoreService()
        user = await firestoreService.syncUser(data.email, {
          email: data.email,
          username: '',
          password: data.password,
        })
      }
      if (!user) {
        session.flash('error', 'User not found! register first')
      } else {
        await auth.use('web').login(user)
        // (auth.isAuthenticated)
        return response.redirect().toPath('/dummy')
      }
    } catch (error) {
      session.flash('errors', 'An unexpected error occurred during login.')
      return response.redirect().back()
    }
  }
}
