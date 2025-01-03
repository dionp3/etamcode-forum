export type User = {
  id: number
  firebaseId: string | null
  username: string
  email: string
  isAdmin: boolean
  createdAt: string
  updatedAt: string
}

export type Profile = {
  userId: number
  displayName?: string | null
  bio: string | null
  isBanned: boolean
  isDeleted: boolean
  banExpiresAt: string | null
  createdAt: string
  updatedAt: string
  user: User
  avatarUrl: string
}

export type Flair = {
  id: number
  name: string
  color: string
}

export type Post = {
  title: string
  content: string
  imageUrl?: string
  slug: string
  displayName: string
  username: string
  forumName: string
  avatarUrl: string
  createdAt: string
  flair: Flair | null
  totalComments?: string
  totalScore?: string
  // TODO: total scores, either downvote or upvote or score directly
}

export type Comment = {
  id: number
  parentCommentId: number | null
  creatorId: number
  postId: number
  content: string
  isRemoved: boolean
  isRead: boolean
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  creator: Profile
  replies?: Comment[]
}

export type Forum = {
  id: number
  iconId: number
  icon: Avatar
  name: string
  description: string
  banner: string
  is_removed: boolean
  is_deleted: boolean
  is_hidden: boolean
  is_posting_restricted_to_mods: boolean
  visibility: 'public' | 'private'
  createdAt: string
  updatedAt: string
}

export type Avatar = {
  id: number
  url: string
  created_at: string
  updated_at: string
}

export type PaginateMeta = {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
  firstPage: number
  firstPageUrl: string
  lastPageUrl: string
  nextPageUrl: string | null
  previousPageUrl: string | null
}
