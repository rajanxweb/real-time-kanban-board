import { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import { AppError } from '../lib/AppError.js';
import { signAccessToken, verifyAccessToken } from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';
import type { AuthUser } from '../types/auth.js';
import type { LoginBody, RegisterBody } from '../validators/auth.js';

const BCRYPT_SALT_ROUNDS = 10;
const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  createdAt: true,
} as const;

type PublicUser = {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
};

function toAuthUser(user: PublicUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
}

export async function registerUser(input: RegisterBody): Promise<{
  user: PublicUser;
  token: string;
}> {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);

  try {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
      },
      select: publicUserSelect,
    });

    const token = signAccessToken({ userId: user.id, email: user.email });

    return { user: toAuthUser(user), token };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      throw new AppError(
        'An account with this email already exists',
        409,
        'EMAIL_ALREADY_EXISTS',
      );
    }

    throw err;
  }
}

export async function loginUser(input: LoginBody): Promise<{
  user: { id: string; email: string; name: string };
  token: string;
}> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new AppError(INVALID_CREDENTIALS_MESSAGE, 401, 'INVALID_CREDENTIALS');
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError(INVALID_CREDENTIALS_MESSAGE, 401, 'INVALID_CREDENTIALS');
  }

  const token = signAccessToken({ userId: user.id, email: user.email });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    token,
  };
}

export async function getUserFromAccessToken(token: string): Promise<AuthUser> {
  const payload = verifyAccessToken(token);
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: publicUserSelect,
  });

  if (!user) {
    throw new AppError('Token is expired or invalid', 401, 'UNAUTHORIZED');
  }

  return toAuthUser(user);
}
