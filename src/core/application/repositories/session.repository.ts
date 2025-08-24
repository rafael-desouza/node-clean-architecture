import { Session } from '@/core/domain/session.entity';

export interface SessionRepositoryPort {
  create(data: Session): Promise<void>;
  findByTokenHash(hash: string): Promise<Session | null>;
  revoke(sessionId: string): Promise<void>;
  update(session: Session): Promise<void>;
}
