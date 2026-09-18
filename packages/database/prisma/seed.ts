import { PrismaClient, Role, DriverAvailability } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean previous seed data (idempotent)
  await prisma.auditLog.deleteMany();
  await prisma.driverDocument.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.address.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.driverProfile.deleteMany();
  await prisma.customerProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // --- Admin ---
  const admin = await prisma.user.create({
    data: {
      email: 'admin@logistics.local',
      phone: '+15550000001',
      passwordHash,
      role: Role.ADMIN,
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`  ✓ Admin: ${admin.email}`);

  // --- Operations Manager ---
  const ops = await prisma.user.create({
    data: {
      email: 'ops@logistics.local',
      phone: '+15550000002',
      passwordHash,
      role: Role.OPERATIONS_MANAGER,
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`  ✓ Ops manager: ${ops.email}`);

  // --- Customer ---
  const customerUser = await prisma.user.create({
    data: {
      email: 'customer@logistics.local',
      phone: '+15550000003',
      passwordHash,
      role: Role.CUSTOMER,
      emailVerifiedAt: new Date(),
      customerProfile: {
        create: {
          fullName: 'Alice Customer',
        },
      },
    },
    include: { customerProfile: true },
  });
  console.log(`  ✓ Customer: ${customerUser.email}`);

  // Customer addresses
  await prisma.address.createMany({
    data: [
      {
        userId: customerUser.id,
        label: 'Home',
        line1: '123 Main Street',
        city: 'Springfield',
        region: 'IL',
        country: 'US',
        lat: 39.7817,
        lng: -89.6501,
        isDefault: true,
      },
      {
        userId: customerUser.id,
        label: 'Work',
        line1: '456 Corporate Blvd',
        city: 'Springfield',
        region: 'IL',
        country: 'US',
        lat: 39.7995,
        lng: -89.644,
        isDefault: false,
      },
    ],
  });
  console.log(`  ✓ Created 2 addresses for customer`);

  // --- Driver ---
  const driverUser = await prisma.user.create({
    data: {
      email: 'driver@logistics.local',
      phone: '+15550000004',
      passwordHash,
      role: Role.DRIVER,
      emailVerifiedAt: new Date(),
      driverProfile: {
        create: {
          fullName: 'Bob Driver',
          availability: DriverAvailability.OFFLINE,
          approvalStatus: 'APPROVED',
          vehicles: {
            create: {
              type: 'CAR',
              plateNumber: 'ABC-1234',
              capacityKg: 250,
              isActive: true,
            },
          },
          documents: {
            create: [
              {
                type: 'LICENSE',
                fileUrl: 'https://example.com/seed/license.pdf',
                status: 'APPROVED',
                reviewedAt: new Date(),
                reviewedBy: admin.id,
              },
              {
                type: 'INSURANCE',
                fileUrl: 'https://example.com/seed/insurance.pdf',
                status: 'APPROVED',
                reviewedAt: new Date(),
                reviewedBy: admin.id,
              },
            ],
          },
        },
      },
    },
  });
  console.log(`  ✓ Driver: ${driverUser.email}`);

  // Audit log entry
  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: 'SEED_RUN',
      entityType: 'System',
      entityId: 'seed',
      metadata: {
        usersCreated: 4,
        addressesCreated: 2,
      },
    },
  });

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
