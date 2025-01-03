import { FirestoreService } from '#services/firestore_service'
import { TurnstileService } from '#services/turnstile_service'
import { registerValidator } from '#validators/auth'
import type { HttpContext } from '@adonisjs/core/http'

export default class RegisterController {
  /**
   * @show
   * @summary Renders register page
   * @tag Auth
   */
  async show({ inertia }: HttpContext) {
    return inertia.render('auth/Register')
  }

  /**
   * @store
   * @summary Handles registration
   * @tag Auth
   * @requestBody {"username": "", "email": "", "password": ""}
   */
  async store({ request, response, session }: HttpContext) {
    try {
      const payload = await request.validateUsing(registerValidator)
      const turnstileToken = request.input('turnstileToken')
      const ip = request.ip()

      const turnstileService = new TurnstileService()
      const isTurnstileVerified = await turnstileService.verify(turnstileToken, ip)

      if (!isTurnstileVerified) {
        session.flash('errors', 'Captcha verification failed.')
        return response.redirect().back()
      }

      const firestoreService = new FirestoreService()
      try {
        const user = await firestoreService.syncUser(payload.email, {
          username: payload.username,
          email: payload.email,
          password: payload.password,
        })
        return response.redirect().toPath('/auth/login')
      } catch (syncError) {
        if (syncError.message === 'User already exists!') {
          session.flash('errors', 'User already exists')
          return response.redirect().back()
        }
      }
    } catch (e) {
      session.flash('error', 'Registration failed, try again.')
      return response.redirect().back()
    }
  }
}
