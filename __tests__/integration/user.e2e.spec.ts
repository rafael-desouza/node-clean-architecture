import { faker } from '@faker-js/faker';
import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createTestApp } from '../helpers/app-factory';
import { cleanupDatabase, setupTestDatabase } from '../helpers/database';

describe('User Endpoints', () => {
  let app: FastifyInstance;
  let pool: Pool;

  beforeAll(async () => {
    await setupTestDatabase();
    pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  });

  beforeEach(async () => {
    await cleanupDatabase(pool);
    const testApp = createTestApp(pool);
    app = testApp.app.getServer() as FastifyInstance;
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

  describe('GET /users/me', () => {
    it('should return the current user data when authenticated', async () => {
      const { user, accessToken } = await createAndLoginUser();

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

    it('should return a 401 Unauthorized error when no token is provided', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/users/me',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return a 401 Unauthorized error for an invalid token', async () => {
      const invalidToken = 'this.is.not.a.valid.jwt';

      const response = await app.inject({
        method: 'GET',
        url: '/users/me',
        headers: {
          Authorization: `Bearer ${invalidToken}`,
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return a 401 Unauthorized error for a malformed token', async () => {
      const malformedToken = 'NotBearer some-token';

      const response = await app.inject({
        method: 'GET',
        url: '/users/me',
        headers: {
          Authorization: malformedToken,
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /users/:id', () => {
    it('should return a specific user when authenticated as an admin', async () => {
      const { accessToken } = await createAndLoginUser('admin');
      const targetUser = await createAndLoginUser('user');

      const response = await app.inject({
        method: 'GET',
        url: `/users/${targetUser.user.id}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.id).toBe(targetUser.user.id);
    });

    it('should return a 403 Forbidden for a regular user', async () => {
      const { accessToken } = await createAndLoginUser('user');

      const response = await app.inject({
        method: 'GET',
        url: `/users/some-other-id`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(403);
    });

    it('should return a 404 Not Found error for a non-existent user ID', async () => {
      const { accessToken } = await createAndLoginUser('admin');
      const nonExistentId = faker.string.uuid();

      const response = await app.inject({
        method: 'GET',
        url: `/users/${nonExistentId}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /users', () => {
    it('should return a list of users when authenticated as an admin', async () => {
      const { accessToken } = await createAndLoginUser('admin');
      await createAndLoginUser('user');
      await createAndLoginUser('user');

      const response = await app.inject({
        method: 'GET',
        url: '/users',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data).toBeInstanceOf(Array);
      expect(body.data).toHaveLength(3);
      expect(body.total).toBe(3);
    });

    it('should return a 403 Forbidden error when authenticated as a regular user', async () => {
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
  });
});
