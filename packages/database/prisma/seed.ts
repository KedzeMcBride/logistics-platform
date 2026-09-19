import { PrismaClient, Role, DriverAvailability } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  await prisma.rating.deleteMany();
  await prisma.deliveryLocation.deleteMany();
  await prisma.deliveryStatusHistory.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.notification.deleteMany();
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

  // --- Sample deliveries (prices in XAF / FCFA) ---
  const delivery1 = await prisma.delivery.create({
    data: {
      customerId: customerUser.customerProfile!.id,
      pickupAddress: '123 Main Street, Springfield, IL',
      pickupLat: 39.7817,
      pickupLng: -89.6501,
      destinationAddress: '456 Corporate Blvd, Springfield, IL',
      destinationLat: 39.7995,
      destinationLng: -89.644,
      packageDescription: 'Small envelope with documents',
      packageSizeCategory: 'SMALL',
      packageWeightKg: 0.5,
      priority: 'STANDARD',
      recipientName: 'Jane Doe',
      recipientPhone: '+15551111111',
      status: 'PENDING',
      estimatedDistanceKm: 2.1,
      estimatedDurationMin: 8,
      estimatedPrice: 1500,
      statusHistory: {
        create: {
          fromStatus: null,
          toStatus: 'PENDING',
          changedBy: customerUser.id,
          reason: 'Created via seed',
        },
      },
    },
  });
  console.log(`  ✓ Delivery 1: ${delivery1.id.slice(0, 8)} (PENDING) - 1500 XAF`);

  const delivery2 = await prisma.delivery.create({
    data: {
      customerId: customerUser.customerProfile!.id,
      pickupAddress: '789 Oak Ave, Springfield, IL',
      pickupLat: 39.768,
      pickupLng: -89.653,
      destinationAddress: '321 Pine St, Springfield, IL',
      destinationLat: 39.79,
      destinationLng: -89.64,
      packageDescription: 'Medium box with electronics',
      packageSizeCategory: 'MEDIUM',
      packageWeightKg: 3.2,
      priority: 'EXPRESS',
      recipientName: 'John Smith',
      recipientPhone: '+15552222222',
      status: 'CONFIRMED',
      estimatedDistanceKm: 4.5,
      estimatedDurationMin: 14,
      estimatedPrice: 2600,
      confirmedAt: new Date(),
      statusHistory: {
        create: [
          {
            fromStatus: null,
            toStatus: 'PENDING',
            changedBy: customerUser.id,
            reason: 'Created via seed',
          },
          {
            fromStatus: 'PENDING',
            toStatus: 'CONFIRMED',
            changedBy: customerUser.id,
            reason: 'Confirmed via seed',
          },
        ],
      },
    },
  });
  console.log(`  ✓ Delivery 2: ${delivery2.id.slice(0, 8)} (CONFIRMED) - 2600 XAF`);

  const delivery3 = await prisma.delivery.create({
    data: {
      customerId: customerUser.customerProfile!.id,
      pickupAddress: '555 Elm St, Springfield, IL',
      pickupLat: 39.775,
      pickupLng: -89.66,
      destinationAddress: '999 Maple Dr, Springfield, IL',
      destinationLat: 39.81,
      destinationLng: -89.63,
      packageDescription: 'Large package with furniture parts',
      packageSizeCategory: 'LARGE',
      packageWeightKg: 12.5,
      priority: 'SAME_DAY',
      recipientName: 'Bob Wilson',
      recipientPhone: '+15553333333',
      status: 'CANCELLED',
      cancelledById: customerUser.id,
      cancelledReason: 'Changed my mind',
      cancelledAt: new Date(),
      estimatedDistanceKm: 8.2,
      estimatedDurationMin: 25,
      estimatedPrice: 5500,
      statusHistory: {
        create: [
          {
            fromStatus: null,
            toStatus: 'PENDING',
            changedBy: customerUser.id,
            reason: 'Created via seed',
          },
          {
            fromStatus: 'PENDING',
            toStatus: 'CANCELLED',
            changedBy: customerUser.id,
            reason: 'Changed my mind',
          },
        ],
      },
    },
  });
  console.log(`  ✓ Delivery 3: ${delivery3.id.slice(0, 8)} (CANCELLED) - 5500 XAF`);

  // --- Notifications ---
  await prisma.notification.createMany({
    data: [
      {
        userId: customerUser.id,
        type: 'WELCOME',
        title: 'Welcome to Portway',
        body: 'Your account is ready. Create your first delivery to get started.',
        channel: 'IN_APP',
        status: 'SENT',
      },
      {
        userId: customerUser.id,
        type: 'SYSTEM_UPDATE',
        title: 'Platform update',
        body: 'Live tracking and instant notifications are coming soon.',
        channel: 'IN_APP',
        status: 'SENT',
        readAt: new Date(),
      },
      {
        userId: customerUser.id,
        type: 'DELIVERY_CREATED',
        title: 'Delivery created',
        body: 'A sample delivery was created for your account (demo).',
        channel: 'IN_APP',
        status: 'SENT',
      },
      {
        userId: driverUser.id,
        type: 'WELCOME',
        title: 'Welcome, driver',
        body: 'Your driver account is approved. Go online to receive delivery offers.',
        channel: 'IN_APP',
        status: 'SENT',
      },
    ],
  });
  console.log(`  ✓ Created 4 notifications`);

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
        deliveriesCreated: 3,
        notificationsCreated: 4,
        currency: 'XAF',
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
