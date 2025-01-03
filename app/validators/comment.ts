import vine from '@vinejs/vine'

export const commentParamValidator = vine.compile(vine.object({ param: vine.number() }))
export const createCommentValidator = vine.compile(
  vine.object({
    content: vine.string().ascii(),
    parentCommentId: vine.number().nullable(),
  }),
)
export const editCommentValidator = vine.compile(
  vine.object({
    content: vine.string().ascii(),
  }),
)
