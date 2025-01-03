export interface User {
  id: number
  firebaseId: string | null
  username: string
  email: string
  isAdmin: boolean
  createdAt: string
  updatedAt: string
}

export interface Profile {
  userId: number
  displayName: string | null
  bio: string | null
  isBanned: boolean
  isDeleted: boolean
  banExpiresAt: string | null
  createdAt: string
  updatedAt: string
  user: User
}

export interface Post {
  id: number
  slug: string
  posterId: number
  forumId: number
  title: string
  content: string
  hasImage: boolean
  imageUrl: string | null
  isRemoved: boolean
  isLocked: boolean
  createdAt: string
  updatedAt: string
  poster: Profile
  forum: Forum
}
export interface Comment {
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

export interface Forum {
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

export interface Avatar {
  id: number
  url: string
  created_at: string
  updated_at: string
}

export interface PaginateMeta {
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
