import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma.js';
import { AppError } from '../lib/errors.js';
import { requiredText } from '../lib/validation.js';
import { publicUser } from '../middleware/auth.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function register({ full_name, email, password }) {
  const fullName = requiredText(full_name, 'Name', { min: 2, max: 120 });
  const normalizedEmail = requiredText(email, 'Email', { max: 254 }).toLowerCase();
  if (!EMAIL_PATTERN.test(normalizedEmail)) throw new AppError('Enter a valid email address.');
  if (typeof password !== 'string' || password.length < 10 || password.length > 200) {
    throw new AppError('Use a password with at least 10 characters.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  return prisma.$transaction(async (tx) => {
    const role = await tx.role.upsert({
      where: { code: 'admin' },
      update: {},
      create: { code: 'admin', name: 'Administrator' },
    });
    const user = await tx.user.create({
      data: {
        email: normalizedEmail,
        full_name: fullName,
        password_hash: passwordHash,
        role_id: role.id,
        settings: { create: { store_name: '', store_tagline: '' } },
      },
      include: { role: true },
    });
    return { record: user, user: publicUser(user) };
  });
}

export async function login({ email, password }) {
  const normalizedEmail = String(email ?? '').trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { role: true },
  });
  if (!user || typeof password !== 'string' || !(await bcrypt.compare(password, user.password_hash))) {
    throw new AppError('Email or password is incorrect.', 401);
  }
  return { record: user, user: publicUser(user) };
}
