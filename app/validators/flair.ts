import vine from '@vinejs/vine'

export const createFlairValidator = vine.compile(
  vine.object({
    forumId: vine.number().positive(),
    name: vine
      .string()
      .alphaNumeric({ allowDashes: true, allowSpaces: true, allowUnderscores: true }),
    color: vine.string().hexCode(),
  })
)
