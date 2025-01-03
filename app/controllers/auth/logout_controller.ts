import type { HttpContext } from '@adonisjs/core/http'

export default class LogoutController {
  /**
   * @handle
   * @summary Handles logout
   * @tag Auth
   */
  async handle({ response, auth }: HttpContext) {
    await auth.use('web').logout()

    return response.redirect().toPath('/')
  }
}
