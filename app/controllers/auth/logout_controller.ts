import type { HttpContext } from '@adonisjs/core/http'

export default class LogoutController {
  /**
   * @handle
   * @summary Handles logout
   * @tag Auth
   */
  async handle({ response, auth, inertia }: HttpContext) {
    await auth.use('web').logout()
    inertia.clearHistory()
    return response.redirect().toPath('/')
  }
}
