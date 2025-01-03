import vine from '@vinejs/vine'

export const sortPostValidator = vine.compile(
  vine.object({
    //sort_by: vine.enum(['id', 'posterId', 'forumId', 'title', 'content', 'createdAt', 'updatedAt']).optional(),
    sort_by: vine.enum(['id', 'poster_id', 'forum_id', 'title', 'content', 'created_at', 'updated_at']).optional(),
    order: vine.enum(['asc', 'desc']).optional(),
  }),
)

export const postValidator = vine.compile(
  vine
    .object({
      title: vine.string().maxLength(100),
      content: vine.string().optional(),
      flairId: vine
        .number()
        .exists(async (db, value) => {
          const match = await db.from('flairs').select('id').where('id', value).first()
          return !!match
        })
        .optional(), // Optional flair ID
      imageFile: vine.file({ extnames: ['jpg', 'jpeg', 'png'], size: '2mb' }).nullable(),
    })
    .merge(
      vine.group([
        vine.group.if((data) => 'forumName' in data, {
          forumName: vine.string().exists(async (db, value) => {
            const match = await db.from('forums').select('name').where('name', value).first()
            return !!match
          }),
        }),
        vine.group.if((data) => 'imageRemoved' in data, {
          imageRemoved: vine.boolean(),
        }),
      ]),
    ),
)

export const pictureValidator = vine.compile(vine.file({ extnames: ['jpg', 'jpeg', 'png'], size: '2mb' }).nullable())
