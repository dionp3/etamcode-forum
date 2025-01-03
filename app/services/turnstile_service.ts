import env from '#start/env'

/**
 * Turnstile Captcha Service
 */
export class TurnstileService {
  /**
   * Verifies a Turnstile token
   * @param token - The Turnstile token to verify
   * @param ip - The IP address of the client
   * @returns A promise that resolves to the verification outcome
   */
  async verify(token: string, ip: string): Promise<boolean> {
    try {
      if (token === null) throw new Error('The token is null')
      const turnstileSecretKey = env.get('TURNSTILE_SECRET_KEY')

      const formData = new FormData()
      formData.append('secret', turnstileSecretKey)
      formData.append('response', token)
      formData.append('remoteip', ip)

      const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        body: formData,
        method: 'POST',
      })

      const outcome: any = await result.json()
      return outcome.success === true
    } catch (error) {
      console.error('Turnstile verification error:', error)
      return false
    }
  }
}
