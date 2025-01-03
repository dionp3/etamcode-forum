import { FirestoreService } from '#services/firestore_service'
import { TurnstileService } from '#services/turnstile_service'
import { registerValidator } from '#validators/auth'
import type { HttpContext } from '@adonisjs/core/http'
import { v4 as uuidv4 } from 'uuid'
import db from '@adonisjs/lucid/services/db'
import mail from '@adonisjs/mail/services/main'
import User from '#models/user'
import filter from '#services/filter_bad_words'

export default class RegisterController {
  /**
   * @show
   * @summary Renders register page
   * @tag Auth
   */
  async show({ inertia }: HttpContext) {
    return inertia.render('auth/register')
  }

  /**
   * @store
   * @summary Handles registration
   * @tag Auth
   * @requestBody {"username": "", "email": "", "password": ""}
   */
  async store({ request, response, session, inertia }: HttpContext) {
    const payload = await request.validateUsing(registerValidator)
    payload.username = filter.clean(payload.username)
    if (payload.username.includes('·')) {
      ;('Curse word detected')
      return response.redirect().toPath('/auth/register')
    }
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
      if (user) {
        const token = uuidv4()
        await db.table('email_verifications').insert({
          email: payload.email,
          verification_token: token,
        })
        const baseUrl =
          process.env.NODE_ENV === 'production' ? 'https://etamcodeforum.zapto.org' : 'http://localhost:3333'

        const url = `${baseUrl}/api/auth/verify/${token}`
        await mail
          .send((message) => {
            message
              .to(payload.email)
              .from('etamforum@resend.dev')
              .subject('Verify your email address')
              .text(`Please verify your email address by clicking on the following link: ${url}`)
          })
          .catch((err) => {
            console.error('Mailer error : ', err)
          })
        return inertia.render('auth/unverified')
      }
    } catch (syncError) {
      if (syncError.message === 'User already exists!') {
        session.flash('errors', 'User already exists')
        return response.redirect().back()
      }
    }
  }

  async verifyEmail({ params, response, session, auth }: HttpContext) {
    try {
      const data = await db
        .from('email_verifications')
        .select('email')
        .where('verification_token', params.token)
        .first()

      if (!data) {
        return response.notFound({ message: 'Token not found.' })
      }

      const user = await User.findByOrFail('email', data.email)

      await user.merge({ isVerified: true }).save()
      await db.from('email_verifications').where('verification_token', params.token).delete()

      session.flash('success', 'User has been verified')

      await auth.use('web').login(user)
      return response.redirect().toPath('/')
    } catch (error) {
      return response.internalServerError({ message: 'Bad Request', error })
    }
  }
}
