import { UnauthorizedError } from '../application/object-values/error/unauthorized-error.error';

export interface CreateSessionProps {
  id: string;
  userId: string;
  refreshTokenHash: string;
  sessionDurationMs: number;
  userAgent?: string | null;
  ip?: string | null;
}

export interface SessionHydrateProps {
  id: string;
  userId: string;
  refreshTokenHash: string;
  replacedBySessionId: string | null;
  userAgent: string | null;
  ip: string | null;
  expiresAt: Date;
  createdAt: Date;
  revokedAt: Date | null;
}

export class Session {
  private constructor(
    private readonly _id: string,
    private readonly _userId: string,
    private readonly _refreshTokenHash: string,
    private _replacedBySessionId: string | null,
    private _userAgent: string | null,
    private _ip: string | null,
    private _expiresAt: Date,
    private readonly _createdAt: Date,
    private _revokedAt: Date | null
  ) {}

  public static create(props: CreateSessionProps): Session {
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + props.sessionDurationMs);

    return new Session(
      props.id,
      props.userId,
      props.refreshTokenHash,
      null,
      props.userAgent ?? null,
      props.ip ?? null,
      expiresAt,
      createdAt,
      null
    );
  }

  public static hydrate(props: SessionHydrateProps): Session {
    return new Session(
      props.id,
      props.userId,
      props.refreshTokenHash,
      props.replacedBySessionId,
      props.userAgent,
      props.ip,
      props.expiresAt,
      props.createdAt,
      props.revokedAt
    );
  }

  get id(): string {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get refreshTokenHash(): string {
    return this._refreshTokenHash;
  }

  get replacedBySessionId(): string | null {
    return this._replacedBySessionId;
  }

  get userAgent(): string | null {
    return this._userAgent;
  }

  get ip(): string | null {
    return this._ip;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get revokedAt(): Date | null {
    return this._revokedAt;
  }

  public isExpired(): boolean {
    return new Date() > this._expiresAt;
  }

  public isRevoked(): boolean {
    return this._revokedAt !== null;
  }

  public isActive(): boolean {
    return !this.isExpired() && !this.isRevoked();
  }

  public revoke(): void {
    if (this.isRevoked()) {
      return;
    }
    this._revokedAt = new Date();
  }

  public replace(newSessionId: string): void {
    this.revoke();
    this._replacedBySessionId = newSessionId;
  }

  public validateForRefresh(): void {
    if (this.revokedAt) {
      throw new UnauthorizedError('Refresh Token was Revoked');
    }

    if (this.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedError('Refresh token is expired');
    }
  }
}
