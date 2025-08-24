import { count, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { UserRepository } from '@/core/application/repositories/user.repository';
import { GetUsersInput } from '@/core/application/use-cases/user/get-all.use-case';
import { User, UserRole } from '@/core/domain/user.entity';
import { users } from '@/infra/persistence/drizzle/schema';
import * as schema from '@/infra/persistence/drizzle/schema';

type DrizzleUserRow = typeof users.$inferSelect;

export class UserRepositoryDrizzle implements UserRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async findAll({
    page,
    limit,
  }: GetUsersInput): Promise<{ data: User[]; total: number }> {
    const offset = (page - 1) * limit;

    const [totalResult, userRows] = await Promise.all([
      this.db.select({ total: count() }).from(users),
      this.db.select().from(users).limit(limit).offset(offset),
    ]);

    const total = totalResult[0].total;
    const mappedUsers = userRows.map((row) => this.toDomain(row));
    return {
      data: mappedUsers,
      total,
    };
  }

  async findByEmail(email: string) {
    const row = (
      await this.db.select().from(users).where(eq(users.email, email)).limit(1)
    )[0];

    if (!row) return null;
    return this.toDomain(row);
  }

  async findById(id: string) {
    const row = (
      await this.db.select().from(users).where(eq(users.id, id)).limit(1)
    )[0];
    if (!row) return null;

    return this.toDomain(row);
  }

  async create(data: User) {
    await this.db.insert(users).values({
      id: data.id,
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role,
    });
  }

  private toDomain(row: DrizzleUserRow): User {
    return User.hydrate({
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      role: row.role as UserRole,
      createdAt: row.createdAt,
    });
  }
}
