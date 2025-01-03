import User from '#models/user'
import { firestore } from '#config/firebase'
import hash from '@adonisjs/core/services/hash'

export class FirestoreService {
  private async findUserByEmail(email: string) {
    const snapshot = await firestore.collection('users').where('email', '==', email).get()
    return snapshot.empty
      ? null
      : {
          id: snapshot.docs[0].id,
          data: snapshot.docs[0].data(),
        }
  }

  async createUser(userData: { email: string; username: string; password: string }) {
    const userRef = await firestore.collection('users').add(userData)
    return userRef.id
  }

  async deleteAllUser() {
    const collection = firestore.collection('users')
    const collectionLen = await collection
      .count()
      .get()
      .then((len) => len.data().count)
    if (collectionLen !== 0) await firestore.recursiveDelete(collection)
  }

  async verifyAndSyncUser(email: string, password: string) {
    const firestoreUser = await this.findUserByEmail(email)
    let localUser = await User.findBy('email', email)

    // User exists in Firestore but not locally
    if (firestoreUser && !localUser) {
      const firestoreData = firestoreUser.data
      const isValid = await hash.verify(firestoreData.password, password)
      if (!isValid) throw new Error('Invalid credentials')
      localUser = await User.create({
        username: firestoreData.username,
        email: firestoreData.email,
        password: password,
        firebaseId: firestoreUser.id,
      })
    }

    if (firestoreUser && localUser) {
      const isValid = await User.verifyCredentials(localUser.email, password)
      if (!isValid) throw new Error('Invalid credentials')
    }

    if (!localUser) {
      throw new Error('User not registered yet')
    }

    return localUser
  }

  async syncUser(
    email: string,
    userData: {
      username: string
      email: string
      password: string
    },
  ) {
    const firestoreUser = await this.findUserByEmail(email)
    let localUser = await User.findBy('email', email)

    // User exists in Firestore but not locally
    if (firestoreUser && !localUser) {
      // return await User.create({
      //   ...userData,
      //   firebaseId: firestoreUser.id,
      // })
      throw new Error('User already exists!')
    }

    // User doesn't exist in either database
    if (!firestoreUser && !localUser) {
      localUser = await User.create(userData)
      const firebaseId = await this.createUser({
        username: localUser.username,
        email: localUser.email,
        password: localUser.password,
      })
      await localUser.merge({ firebaseId }).save()
      return localUser
    }
    return localUser
  }
}
