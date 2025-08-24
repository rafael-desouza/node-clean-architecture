import { randomUUID } from 'node:crypto';

import { faker } from '@faker-js/faker';

import { Session, SessionHydrateProps } from '@/core/domain/session.entity';

export class SessionBuilder {
  private props: SessionHydrateProps = {
    id: randomUUID(),
    userId: randomUUID(),
    refreshTokenHash: faker.string.hexadecimal({ length: 64 }),
    replacedBySessionId: null,
    userAgent: faker.internet.userAgent(),
    ip: faker.internet.ip(),
    expiresAt: faker.date.future(),
    createdAt: new Date(),
    revokedAt: null,
  };

  public withId(id: string): this {
    this.props.id = id;
    return this;
  }

  public withUserId(userId: string): this {
    this.props.userId = userId;
    return this;
  }

  public withRefreshTokenHash(hash: string): this {
    this.props.refreshTokenHash = hash;
    return this;
  }

  public thatIsRevoked(): this {
    this.props.revokedAt = new Date();
    return this;
  }

  public thatIsExpired(): this {
    this.props.expiresAt = faker.date.past();
    return this;
  }

  public build(): Session {
    return Session.hydrate(this.props);
  }
}
