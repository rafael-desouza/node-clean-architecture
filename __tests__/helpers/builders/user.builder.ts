import { randomUUID } from 'node:crypto';

import { faker } from '@faker-js/faker';

import { User, UserRole } from '@/core/domain/user.entity';

interface BuilderProps {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
}

export class UserBuilder {
  private props: BuilderProps = {
    id: randomUUID(),
    email: faker.internet.email(),
    passwordHash: 'any_hashed_password',
    role: 'user',
    createdAt: new Date(),
  };

  public withId(id: string): this {
    this.props.id = id;
    return this;
  }

  public withEmail(email: string): this {
    this.props.email = email;
    return this;
  }

  public withRole(role: UserRole): this {
    this.props.role = role;
    return this;
  }

  public withCreatedAt(createdAt: Date): this {
    this.props.createdAt = createdAt;
    return this;
  }

  public build(): User {
    return User.hydrate(this.props);
  }
}
