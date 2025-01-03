import { storage } from '#config/firebase'
import type User from '#models/user'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import app from '@adonisjs/core/services/app'
import { randomUUID } from 'node:crypto'
import { getDownloadURL } from 'firebase-admin/storage'
import * as fs from 'node:fs/promises'

export class FirebaseStorageService {
  private async uploadFile(file: MultipartFile, user: User, bucket: string): Promise<string> {
    const uniqueTempFileName = `${randomUUID()}${file.clientName}`
    await file.move(app.tmpPath('uploads'), { name: uniqueTempFileName })

    const fileBuf = await fs.readFile(app.tmpPath('uploads', uniqueTempFileName))
    const uniqueFileName = `${user.id}/${Date.now()}-${file.clientName}`

    try {
      const fileUpload = storage.file(`${bucket}/${uniqueFileName}`)
      await fileUpload.save(fileBuf, {
        metadata: {
          contentType: `${file.type}/${file.subtype}`,
        },
      })
      return await getDownloadURL(fileUpload)
    } catch (error) {
      throw new Error(`File upload failed: ${error.message}`)
    } finally {
      await fs.unlink(app.tmpPath('uploads', uniqueTempFileName)).catch(() => {})
    }
  }

  async uploadPostImage(file: MultipartFile, user: User): Promise<string> {
    return this.uploadFile(file, user, 'post-images')
  }

  async uploadProfileAvatar(file: MultipartFile, user: User): Promise<string> {
    return this.uploadFile(file, user, 'profile-avatar')
  }

  async uploadForumIcon(file: MultipartFile, user: User): Promise<string> {
    return this.uploadFile(file, user, 'forum-icon')
  }
}
