import vine from '@vinejs/vine'

export const createForumValidator = vine.compile(
  vine.object({
    name: vine
      .string()
      .alphaNumeric({ allowUnderscores: true, allowSpaces: false, allowDashes: false }),
    description: vine.string().optional(),
    isPostingRestricted: vine.boolean(),
  })
)

export const sortForumValidator = vine.compile(
  vine.object({
    sort_by: vine
      .enum([
        'id',
        'name',
        // 'popular', 'content', 'created_at', 'updated_at'
      ])
      .optional(),
    order: vine.enum(['asc', 'desc']).optional(),
  })
)

export const pictureValidator = vine.compile(
  vine.object({
    imageUrl: vine.file({ extnames: ['jpg', 'jpeg', 'png'], size: '2mb' }).nullable(),
  })
)
