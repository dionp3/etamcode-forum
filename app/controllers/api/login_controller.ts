import User from '#models/user'
import { firestore } from '#config/firebase'
import { loginValidator } from '#validators/auth'
import type { HttpContext } from '@adonisjs/core/http'
import { FirestoreService } from '#services/firestore_service'

export default class LoginController {
  async store({ request, response, auth, session }: HttpContext) {
    try {
      const data = await request.validateUsing(loginValidator)
      let user
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
        // console.log(auth.isAuthenticated)
        return response.redirect().toPath('/dummy')
      }
    } catch (error) {
      console.error(error)
      session.flash('errors', 'An unexpected error occurred during login.')
      return response.redirect().back()
    }
  }
}
