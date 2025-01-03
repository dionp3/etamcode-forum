import vine from '@vinejs/vine'

export const sortPostValidator = vine.compile(
  vine.object({
    //sort_by: vine.enum(['id', 'posterId', 'forumId', 'title', 'content', 'createdAt', 'updatedAt']).optional(),
    sort_by: vine
      .enum(['id', 'poster_id', 'forum_id', 'title', 'content', 'created_at', 'updated_at'])
      .optional(),
    order: vine.enum(['asc', 'desc']).optional(),
  })
)

export const storePostValidator = vine.compile(
  vine.object({
    title: vine.string().maxLength(100), // Max length for title
    content: vine.string().optional(), // Optional content
    forumId: vine.number(),
    flairId: vine.number().optional(), // Optional flair ID
  })
)

export const pictureValidator = vine.compile(
  vine.object({
    imageUrl: vine.file({ extnames: ['jpg', 'jpeg', 'png'], size: '2mb' }).nullable(),
  })
)
