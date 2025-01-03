import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class OauthLoginController {
  /**
   * @redirect
   * @summary Redirects to Google's login page
   * @tag Auth
   */
  async redirect({ ally }: HttpContext) {
    return ally.use('google').redirect()
  }

  /**
   * @callback
   * @summary Redirects to app
   * @tag Auth
   */
  async callback({ ally, auth, response }: HttpContext) {
    const user = ally.use('google')

    if (user.accessDenied()) {
      return response.redirect('/login')
    }

    if (user.hasError()) {
      return user.getError()
    }

    const { email, name, token } = await user.user()
    let googleUser = await User.findBy('email', email)
    if (!googleUser) {
      googleUser = await User.create({
        email: email,
        username: name.replace(/\s+/g, '_'),
        password: 'admin1234',
      })
    }

    await auth.use('web').login(googleUser)

    return response.redirect().toPath('/')
  }
}
