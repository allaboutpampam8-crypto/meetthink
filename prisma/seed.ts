import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ─── Users ───────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@1234', 12)
  const userPassword  = await bcrypt.hash('User@1234', 12)

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@company.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'superadmin@company.com',
      password: adminPassword,
      role: Role.SUPER_ADMIN,
      division: 'IT',
      position: 'System Administrator',
    },
  })

  const adminFasilitas = await prisma.user.upsert({
    where: { email: 'fasilitas@company.com' },
    update: {},
    create: {
      name: 'Admin Fasilitas',
      email: 'fasilitas@company.com',
      password: adminPassword,
      role: Role.APPROVER,
      division: 'General Affairs',
      position: 'Staff Fasilitas',
    },
  })

  const kepalaDivisi = await prisma.user.upsert({
    where: { email: 'kepala@company.com' },
    update: {},
    create: {
      name: 'Kepala Divisi IT',
      email: 'kepala@company.com',
      password: adminPassword,
      role: Role.APPROVER,
      division: 'IT',
      position: 'Kepala Divisi',
    },
  })

  const user1 = await prisma.user.upsert({
    where: { email: 'budi@company.com' },
    update: {},
    create: {
      name: 'Budi Santoso',
      email: 'budi@company.com',
      password: userPassword,
      role: Role.USER,
      division: 'IT',
      position: 'Developer',
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'sari@company.com' },
    update: {},
    create: {
      name: 'Sari Dewi',
      email: 'sari@company.com',
      password: userPassword,
      role: Role.USER,
      division: 'Marketing',
      position: 'Marketing Staff',
    },
  })

  const managerMarketing = await prisma.user.upsert({
    where: { email: 'manager.marketing@company.com' },
    update: { division: 'Marketing', role: Role.APPROVER },
    create: {
      name: 'Manager Marketing',
      email: 'manager.marketing@company.com',
      password: adminPassword,
      role: Role.APPROVER,
      division: 'Marketing',
      position: 'Marketing Manager',
    },
  })

  console.log('✅ Users seeded')

  // ─── Rooms ───────────────────────────────────────────────────────────
  const rooms = [
    {
      name: 'Ruang Rapat Direksi',
      code: 'RR-DIR',
      location: 'Gedung A, Lantai 5',
      floor: '5',
      capacity: 20,
      description: 'Ruang rapat utama untuk direksi dan manajemen senior',
      operationalHours: {
        mon: ['08:00', '17:00'], tue: ['08:00', '17:00'],
        wed: ['08:00', '17:00'], thu: ['08:00', '17:00'],
        fri: ['08:00', '16:00'], sat: null, sun: null,
      },
      facilities: ['Proyektor 4K', 'Video Conference', 'AC', 'Whiteboard', 'Sound System'],
    },
    {
      name: 'Ruang Rapat A',
      code: 'RR-A',
      location: 'Gedung A, Lantai 2',
      floor: '2',
      capacity: 10,
      description: 'Ruang rapat sedang untuk diskusi divisi',
      operationalHours: {
        mon: ['08:00', '17:00'], tue: ['08:00', '17:00'],
        wed: ['08:00', '17:00'], thu: ['08:00', '17:00'],
        fri: ['08:00', '17:00'], sat: null, sun: null,
      },
      facilities: ['Proyektor', 'AC', 'Whiteboard'],
    },
    {
      name: 'Ruang Rapat B',
      code: 'RR-B',
      location: 'Gedung A, Lantai 2',
      floor: '2',
      capacity: 8,
      description: 'Ruang rapat kecil untuk tim kecil atau 1-on-1',
      operationalHours: {
        mon: ['08:00', '17:00'], tue: ['08:00', '17:00'],
        wed: ['08:00', '17:00'], thu: ['08:00', '17:00'],
        fri: ['08:00', '17:00'], sat: null, sun: null,
      },
      facilities: ['TV 55 Inch', 'AC', 'Whiteboard'],
    },
    {
      name: 'Aula Serbaguna',
      code: 'AULA-01',
      location: 'Gedung B, Lantai 1',
      floor: '1',
      capacity: 100,
      description: 'Aula besar untuk pelatihan, seminar, dan acara perusahaan',
      operationalHours: {
        mon: ['07:00', '20:00'], tue: ['07:00', '20:00'],
        wed: ['07:00', '20:00'], thu: ['07:00', '20:00'],
        fri: ['07:00', '20:00'], sat: ['08:00', '17:00'], sun: null,
      },
      facilities: ['Proyektor Ganda', 'Video Conference', 'AC', 'Sound System', 'Mic Wireless', 'Podium'],
    },
  ]

  for (const roomData of rooms) {
    const { facilities, ...data } = roomData
    const room = await prisma.room.upsert({
      where: { code: data.code },
      update: {},
      create: data,
    })
    // Facilities
    for (const facility of facilities) {
      await prisma.roomFacility.upsert({
        where: { id: `${room.id}-${facility}` },
        update: {},
        create: { id: `${room.id}-${facility}`, roomId: room.id, name: facility },
      })
    }
  }

  console.log('✅ Rooms seeded')

  // ─── Approval Flows ───────────────────────────────────────────────────
  // 1. Alur Khusus IT (division: 'IT')
  await prisma.approvalFlow.upsert({
    where: { id: 'it-approval-flow' },
    update: { division: 'IT' },
    create: {
      id: 'it-approval-flow',
      name: 'Alur Approval Divisi IT',
      description: 'Level 1: Kepala Divisi IT → Level 2: Admin Fasilitas',
      division: 'IT',
      isDefault: false,
      steps: {
        create: [
          {
            level: 1,
            label: 'Kepala Divisi IT',
            approverId: kepalaDivisi.id,
            deadlineHours: 24,
          },
          {
            level: 2,
            label: 'Admin Fasilitas',
            approverId: adminFasilitas.id,
            deadlineHours: 8,
          },
        ],
      },
    },
  })

  // 2. Alur Khusus Marketing (division: 'Marketing')
  await prisma.approvalFlow.upsert({
    where: { id: 'marketing-approval-flow' },
    update: { division: 'Marketing' },
    create: {
      id: 'marketing-approval-flow',
      name: 'Alur Approval Divisi Marketing',
      description: 'Level 1: Manager Marketing → Level 2: Admin Fasilitas',
      division: 'Marketing',
      isDefault: false,
      steps: {
        create: [
          {
            level: 1,
            label: 'Manager Marketing',
            approverId: managerMarketing.id,
            deadlineHours: 24,
          },
          {
            level: 2,
            label: 'Admin Fasilitas',
            approverId: adminFasilitas.id,
            deadlineHours: 8,
          },
        ],
      },
    },
  })

  // 3. Alur Default (Semua Divisi / Umum)
  await prisma.approvalFlow.upsert({
    where: { id: 'default-approval-flow' },
    update: { division: null, isDefault: true },
    create: {
      id: 'default-approval-flow',
      name: 'Alur Approval Umum / Default',
      description: 'Untuk divisi umum yang belum memiliki alur khusus',
      division: null,
      isDefault: true,
      steps: {
        create: [
          {
            level: 1,
            label: 'Kepala Divisi',
            approverId: kepalaDivisi.id,
            deadlineHours: 24,
          },
          {
            level: 2,
            label: 'Admin Fasilitas',
            approverId: adminFasilitas.id,
            deadlineHours: 8,
          },
        ],
      },
    },
  })

  console.log('✅ Approval flow seeded')
  console.log('')
  console.log('🎉 Seed complete!')
  console.log('')
  console.log('Akun yang tersedia:')
  console.log('  Super Admin : superadmin@company.com / Admin@1234')
  console.log('  Kepala IT   : kepala@company.com     / Admin@1234')
  console.log('  Mgr Mktg    : manager.marketing@company.com / Admin@1234')
  console.log('  Admin Fas.  : fasilitas@company.com  / Admin@1234')
  console.log('  User 1 (IT) : budi@company.com        / User@1234')
  console.log('  User 2 (Mkt): sari@company.com        / User@1234')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
