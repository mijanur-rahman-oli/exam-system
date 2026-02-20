// scripts/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin',
      isVerified: true,
    },
  });

  // Create subjects
  const subjects = await prisma.subject.createMany({
    data: [
      { name: 'Mathematics', description: 'Mathematics questions' },
      { name: 'Physics', description: 'Physics questions' },
      { name: 'Chemistry', description: 'Chemistry questions' },
      { name: 'Biology', description: 'Biology questions' },
    ],
    skipDuplicates: true,
  });

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });