import vine from '@vinejs/vine'

export const createForumValidator = vine.compile(
  vine.object({
    name: vine.string().alphaNumeric({ allowUnderscores: false, allowSpaces: false, allowDashes: true }),
    description: vine.string().optional(),
    isPostingRestricted: vine.boolean(),
    visibility: vine.string().optional(),
  }),
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
  }),
)

export const pictureValidator = vine.compile(
  vine.object({
    imageUrl: vine.file({ extnames: ['jpg', 'jpeg', 'png'], size: '2mb' }).nullable(),
  }),
)
