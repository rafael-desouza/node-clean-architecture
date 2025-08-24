import { SessionBuilder } from 'tests/helpers/builders/session.builder';
import { describe, expect, it } from 'vitest';

import { UnauthorizedError } from '@/core/application/object-values/error/unauthorized-error.error';

describe('Session Entity', () => {
  describe('validateForRefresh', () => {
    it('should not throw error for an active session', () => {
      const activeSession = new SessionBuilder().build();

      expect(() => activeSession.validateForRefresh()).not.toThrow();
    });

    it('should throw UnauthorizedError for a revoked session', () => {
      const revokedSession = new SessionBuilder().thatIsRevoked().build();

      expect(() => revokedSession.validateForRefresh()).toThrow(
        UnauthorizedError
      );
      expect(() => revokedSession.validateForRefresh()).toThrow(
        'Refresh Token was Revoked'
      );
    });

    it('should throw UnauthorizedError for an expired session', () => {
      const expiredSession = new SessionBuilder().thatIsExpired().build();

      expect(() => expiredSession.validateForRefresh()).toThrow(
        UnauthorizedError
      );
      expect(() => expiredSession.validateForRefresh()).toThrow(
        'Refresh token is expired'
      );
    });
  });

  describe('revoke', () => {
    it('should define revoke date and inactivate the session', () => {
      const session = new SessionBuilder().build();
      expect(session.isActive()).toBe(true);

      session.revoke();

      expect(session.isRevoked()).toBe(true);
      expect(session.revokedAt).toBeInstanceOf(Date);
      expect(session.isActive()).toBe(false);
    });

    it('should do nothing if the session is already revoked', () => {
      const alreadyRevokedSession = new SessionBuilder()
        .thatIsRevoked()
        .build();
      const firstRevocationDate = alreadyRevokedSession.revokedAt;

      alreadyRevokedSession.revoke();

      expect(alreadyRevokedSession.revokedAt).toBe(firstRevocationDate);
    });
  });
});
