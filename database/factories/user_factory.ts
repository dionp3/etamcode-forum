import factory from '@adonisjs/lucid/factories'
import User from '#models/user'
import validator from 'validator'

export const UserFactory = factory
  .define(User, async ({ faker }) => {
    const exampleEmail = faker.internet.exampleEmail()
    const normalizeEmail = validator.normalizeEmail(exampleEmail) || exampleEmail
    return {
      username: faker.internet.username(),
      email: normalizeEmail,

      password: '12341234',
      isAdmin: false,
      isVerified: true,
    }
  })
  .build()
