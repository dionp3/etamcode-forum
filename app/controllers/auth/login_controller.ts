import { loginValidator } from '#validators/auth'
import type { HttpContext } from '@adonisjs/core/http'
import { FirestoreService } from '#services/firestore_service'
import { TurnstileService } from '#services/turnstile_service'
import type User from '#models/user'

export default class LoginController {
  /**
   * @show
   * @summary Renders login page
   * @tag Auth
   */
  async show({ inertia }: HttpContext) {
    return inertia.render('auth/login')
  }

  /**
   * @store
   * @summary Handles login
   * @tag Auth
   * @requestBody {"email": "Lorem", "password": "Lorem"}
   */
  async store({ request, response, auth, session, inertia }: HttpContext) {
    const payload = await request.validateUsing(loginValidator)
    const turnstileToken = request.input('turnstileToken')
    const ip = request.ip()

    const turnstileService = new TurnstileService()
    const isTurnstileVerified = await turnstileService.verify(turnstileToken, ip)

    if (!isTurnstileVerified) {
      session.flash('errors', 'Captcha verification failed.')
      return response.redirect().back()
    }

    let user: User | null = null
    if ('email' in payload) {
      const firestoreService = new FirestoreService()
      try {
        user = await firestoreService.verifyAndSyncUser(payload.email, payload.password)
      } catch (verifyError) {
        if (verifyError.message === 'Invalid credentials') {
          session.flash('errors', 'Invalid email or password.')
        } else if (verifyError.message === 'User not registered yet') {
          session.flash('errors', 'User not found. Please register first.')
        } else {
          session.flash('errors', 'Login failed. Please try again.')
        }
        return response.redirect().back()
      }
    }
    if (!user) {
      return response.redirect().toPath('/')
    }

    if (user?.isVerified === false) {
      return inertia.render('auth/unverified', { email: user.email })
    }
    await auth.use('web').login(user)
    return response.redirect().back()
  }
}
