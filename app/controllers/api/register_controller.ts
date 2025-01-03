import { firestore } from '#config/firebase'
import User from '#models/user'
import { FirestoreService } from '#services/firestore_service'
import { registerValidator } from '#validators/auth'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { v4 as uuidv4 } from 'uuid'
import mail from '@adonisjs/mail/services/main'

export default class RegisterController {
  async store({ request, response, auth, session }: HttpContext) {
    try {
      const data = await request.validateUsing(registerValidator)
      // if the data exists in the doc, but not in local, create in local, if the data dont exists in both database, create to them both
      const firestoreService = new FirestoreService()

      const user = await firestoreService.syncUser(data.email, {
        username: data.username,
        email: data.email,
        password: data.password,
      })

      if (user) {
        const token = uuidv4()
        await db.table('email_verifications').insert({
          email: data.email,
          verification_token: token,
        })
        // TODO : Ubah base URL jadi url asli
        // https://www.etamforum.zapto.org/

        const url = `http://localhost:3333/api/auth/verify/${token}`
        await mail
          .send((message) => {
            message
              .to(user.email)
              .from('etamforum@resend.dev')
              .subject('Verify your email address')
              .text(`Please verify your email address by clicking on the following link: ${url}`)
          })
          .catch((error) => {
            console.error('Mailgun Error:', error)
          })

        await auth.use('web').login(user)
      }
      return response.redirect().toPath('/')
    } catch (e) {
      session.flash('error', 'Registration failed, try again.')
      return response.redirect().back()
    }
  }

  async verifyEmail({ params, request, response, session, auth }: HttpContext) {
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
      error
      return response.internalServerError({ message: 'Bad Request', error })
    }
  }
}
