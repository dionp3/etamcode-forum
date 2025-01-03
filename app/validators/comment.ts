import vine from '@vinejs/vine'

export const commentParamValidator = vine.compile(vine.object({ param: vine.number() }))
export const createCommentValidator = vine.compile(
  vine.object({
    content: vine.string().ascii(),
    postId: vine.number().positive(),
    creatorId: vine.number().positive(),
  })
)
export const editCommentValidator = vine.compile(
  vine.object({
    content: vine.string().ascii(),
  })
)
