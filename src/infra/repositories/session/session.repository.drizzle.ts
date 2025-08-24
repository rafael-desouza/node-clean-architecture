import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { SessionRepositoryPort } from '@/core/application/repositories/session.repository';
import { Session } from '@/core/domain/session.entity';
import { sessions } from '@/infra/persistence/drizzle/schema';
import * as schema from '@/infra/persistence/drizzle/schema';

export class SessionRepositoryDrizzle implements SessionRepositoryPort {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async create(session: Session): Promise<void> {
    await this.db.insert(sessions).values({
      id: session.id,
      userId: session.userId,
      refreshTokenHash: session.refreshTokenHash,
      userAgent: session.userAgent,
      ip: session.ip,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
    });
  }

  async findByTokenHash(hash: string): Promise<Session | null> {
    const row = await this.db.query.sessions.findFirst({
      where: eq(sessions.refreshTokenHash, hash),
    });

    if (!row) {
      return null;
    }

    return Session.hydrate({
      id: row.id,
      userId: row.userId,
      refreshTokenHash: row.refreshTokenHash,
      userAgent: row.userAgent,
      ip: row.ip,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      revokedAt: row.revokedAt,
      replacedBySessionId: row.replacedBySessionId,
    });
  }

  async revoke(id: string): Promise<void> {
    await this.db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(eq(sessions.id, id));
  }

  async update(session: Session): Promise<void> {
    await this.db
      .update(sessions)
      .set({
        revokedAt: session.revokedAt,
        replacedBySessionId: session.replacedBySessionId,
      })
      .where(eq(sessions.id, session.id));
  }
}
