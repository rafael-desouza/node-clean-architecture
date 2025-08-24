export type UserRole = 'user' | 'admin';

interface UserCreateProps {
  id: string;
  email: string;
  passwordHash: string;
  role?: UserRole;
}

interface UserHydrateProps {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
}

export class User {
  private constructor(
    private readonly _id: string,
    private readonly _email: string,
    private readonly _passwordHash: string,
    private readonly _role: UserRole,
    private readonly _createdAt: Date
  ) {}

  get id(): string {
    return this._id;
  }

  get email(): string {
    return this._email;
  }

  get passwordHash(): string {
    return this._passwordHash;
  }

  get role(): UserRole {
    return this._role;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  public static create(props: UserCreateProps): User {
    const user = new User(
      props.id,
      props.email,
      props.passwordHash,
      props.role ?? 'user',
      new Date()
    );
    return user;
  }

  public static hydrate(props: UserHydrateProps): User {
    return new User(
      props.id,
      props.email,
      props.passwordHash,
      props.role,
      props.createdAt
    );
  }
}
