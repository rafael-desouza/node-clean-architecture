import argon2 from 'argon2';

import { PasswordHasherPort } from '@/core/application/ports/password-hasher.port';

export class Argon2PasswordHasher implements PasswordHasherPort {
  hash(plain: string) {
    return argon2.hash(plain);
  }
  verify(hash: string, plain: string) {
    return argon2.verify(hash, plain);
  }
}
