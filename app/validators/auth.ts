import vine from '@vinejs/vine'

export const registerValidator = vine.compile(
  vine.object({
    username: vine.string().maxLength(30),
    email: vine.string().email().normalizeEmail(),
    password: vine.string().minLength(8).maxLength(32),
  }),
)

export const loginValidator = vine.compile(
  vine.object({ password: vine.string().minLength(8).maxLength(32) }).merge(
    vine.group([
      vine.group.if((data) => 'username' in data, {
        username: vine.string().maxLength(30),
      }),
      vine.group.if((data) => 'email' in data, {
        email: vine.string().email().normalizeEmail(),
      }),
    ]),
  ),
)
