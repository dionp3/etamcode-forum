import vine from '@vinejs/vine'

export const votePostValidator = vine.compile(
  vine.object({
    userId: vine.number().positive(),
    postSlug: vine.string(),
  })
)

export const voteCommentValidator = vine.compile(
  vine.object({
    userId: vine.number().positive(),
    commentSlug: vine.string(),
  })
)
