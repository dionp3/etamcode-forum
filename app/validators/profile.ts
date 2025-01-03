import vine from '@vinejs/vine'

export const updateProfileValidator = vine.compile(
  vine.object({
    displayName: vine.string().optional(),
    bio: vine.string().optional(),
  }),
)

export const avatarValidator = vine.compile(
  vine.object({
    imageUrl: vine.file({ extnames: ['jpg', 'jpeg', 'png'], size: '2mb' }).nullable(),
  }),
)
