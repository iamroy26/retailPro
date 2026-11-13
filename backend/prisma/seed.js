import '../src/config/env.js';
import { prisma } from '../src/db/prisma.js';

try {
  await Promise.all([
    prisma.role.upsert({
      where: { code: 'admin' },
      update: { name: 'Administrator' },
      create: { code: 'admin', name: 'Administrator' },
    }),
    prisma.role.upsert({
      where: { code: 'manager' },
      update: { name: 'Manager' },
      create: { code: 'manager', name: 'Manager' },
    }),
    prisma.role.upsert({
      where: { code: 'cashier' },
      update: { name: 'Cashier' },
      create: { code: 'cashier', name: 'Cashier' },
    }),
  ]);
  console.log('Default roles are ready.');
} finally {
  await prisma.$disconnect();
}
