import { faker } from '@faker-js/faker';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import * as schema from '@/infra/persistence/drizzle/schema';

import { createTestApp } from '../helpers/app-factory';
import { cleanupDatabase, setupTestDatabase } from '../helpers/database';

describe('Auth Endpoints', () => {
  let app: FastifyInstance;
  let db: NodePgDatabase<typeof schema>;
  let pool: Pool;

  beforeAll(async () => {
    await setupTestDatabase();
    pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  });

  beforeEach(async () => {
    await cleanupDatabase(pool);
    const testApp = createTestApp(pool);
    app = testApp.app.getServer() as FastifyInstance;
    db = testApp.db;
  });

  afterAll(async () => {
    await pool.end();
  });

  async function createAndLoginUser(role: 'user' | 'admin' = 'user') {
    const userData = {
      email: faker.internet.email(),
      password: 'Password123',
      role,
    };
    const signupResponse = await app.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: userData,
    });
    const user = JSON.parse(signupResponse.payload);

    const signinResponse = await app.inject({
      method: 'POST',
      url: '/auth/signin',
      payload: { email: userData.email, password: userData.password },
    });
    const { accessToken } = JSON.parse(signinResponse.payload);

    return { user, accessToken };
  }

  describe('POST /auth/signup', () => {
    it('should create a new user and return a 201 status code', async () => {
      const payload = {
        email: faker.internet.email(),
        password: 'Password123',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/auth/signup',
        payload,
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.payload);
      expect(body.id).toBeTypeOf('string');
      expect(body.email).toBe(payload.email);
      expect(body.role).toBe('user');

      const userInDb = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, payload.email),
      });

      expect(userInDb).toBeDefined();
      expect(userInDb?.email).toBe(payload.email);
      expect(userInDb?.passwordHash).toBeTypeOf('string');
      expect(userInDb?.passwordHash).not.toBe(payload.password);
    });

    it('should return a 409 status code if the email is already in use', async () => {
      const payload = {
        email: faker.internet.email(),
        password: 'Password123',
      };
      await app.inject({ method: 'POST', url: '/auth/signup', payload });

      const response = await app.inject({
        method: 'POST',
        url: '/auth/signup',
        payload,
      });

      expect(response.statusCode).toBe(409);
    });

    it('should return a 422 status code for an invalid payload', async () => {
      const payload = {
        email: 'not-an-email',
        password: '123',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/auth/signup',
        payload,
      });

      expect(response.statusCode).toBe(422);
    });
  });

  describe('POST /auth/signin', () => {
    it('should authenticate the user and return tokens on success', async () => {
      const password = 'Password123';
      const userPayload = { email: faker.internet.email(), password };
      await app.inject({
        method: 'POST',
        url: '/auth/signup',
        payload: userPayload,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/auth/signin',
        payload: { email: userPayload.email, password },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.accessToken).toBeTypeOf('string');
      expect(body.refreshToken).toBeTypeOf('string');
      expect(body.userRole).toBe('user');

      const sessionInDb = await db.query.sessions.findFirst();
      expect(sessionInDb).toBeDefined();
      const userInDb = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, userPayload.email),
      });
      expect(sessionInDb?.userId).toBe(userInDb?.id);
    });

    it('should return a 401 status code for an incorrect password', async () => {
      const password = 'Password123';
      const userPayload = { email: faker.internet.email(), password };
      await app.inject({
        method: 'POST',
        url: '/auth/signup',
        payload: userPayload,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/auth/signin',
        payload: { email: userPayload.email, password: 'WrongPassword' },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return a 404 status code for a non-existent user', async () => {
      const payload = {
        email: faker.internet.email(),
        password: 'Password123',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/auth/signin',
        payload,
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /auth/signout', () => {
    it('should revoke the session and return a 204 status code', async () => {
      const password = 'Password123';
      const userPayload = { email: faker.internet.email(), password };
      await app.inject({
        method: 'POST',
        url: '/auth/signup',
        payload: userPayload,
      });
      const signinResponse = await app.inject({
        method: 'POST',
        url: '/auth/signin',
        payload: { email: userPayload.email, password },
      });
      const { refreshToken } = JSON.parse(signinResponse.payload);

      const sessionBeforeSignout = await db.query.sessions.findFirst();
      expect(sessionBeforeSignout?.revokedAt).toBeNull();

      const response = await app.inject({
        method: 'POST',
        url: '/auth/signout',
        payload: { refreshToken },
      });

      expect(response.statusCode).toBe(204);
      const sessionAfterSignout = await db.query.sessions.findFirst({
        where: (sessions, { eq }) => eq(sessions.id, sessionBeforeSignout!.id),
      });
      expect(sessionAfterSignout?.revokedAt).toBeInstanceOf(Date);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should issue new tokens and rotate the session', async () => {
      const password = 'Password123';
      const userPayload = { email: faker.internet.email(), password };
      await app.inject({
        method: 'POST',
        url: '/auth/signup',
        payload: userPayload,
      });
      const signinResponse = await app.inject({
        method: 'POST',
        url: '/auth/signin',
        payload: { email: userPayload.email, password },
      });
      const { refreshToken: oldRefreshToken } = JSON.parse(
        signinResponse.payload
      );
      const oldSession = await db.query.sessions.findFirst();

      const response = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        payload: { refreshToken: oldRefreshToken },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.accessToken).toBeTypeOf('string');
      expect(body.refreshToken).toBeTypeOf('string');
      expect(body.refreshToken).not.toBe(oldRefreshToken);

      const oldSessionInDb = await db.query.sessions.findFirst({
        where: (sessions, { eq }) => eq(sessions.id, oldSession!.id),
      });
      const newSessionInDb = await db.query.sessions.findFirst({
        where: (sessions, { eq }) => eq(sessions.id, body.sessionId),
      });

      expect(oldSessionInDb?.revokedAt).toBeInstanceOf(Date);
      expect(oldSessionInDb?.replacedBySessionId).toBe(newSessionInDb!.id);
      expect(newSessionInDb).toBeDefined();
      expect(newSessionInDb?.revokedAt).toBeNull();
    });

    it('should return a 401 Unauthorized error for an invalid refresh token', async () => {
      const invalidRefreshToken = 'this-token-does-not-exist';

      const response = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        payload: { refreshToken: invalidRefreshToken },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /users/me (Protected Route)', () => {
    it('should return the user data when authenticated as a user', async () => {
      const { user, accessToken } = await createAndLoginUser('user');

      const response = await app.inject({
        method: 'GET',
        url: '/users/me',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.id).toBe(user.id);
      expect(body.email).toBe(user.email);
    });

    it('should return a 403 Forbidden error if a user tries to access a route protected for admins only', async () => {
      const { accessToken } = await createAndLoginUser('user');

      const response = await app.inject({
        method: 'GET',
        url: '/users',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(403);
    });

    it('should return a 401 Unauthorized error when no token is provided', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/users/me',
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
