/* eslint-disable no-console */
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const daysFromNow = (d: number) => new Date(Date.now() + d * DAY);

async function main() {
  const passwordHash = await bcrypt.hash('Example-Passw0rd!', 10);

  const org = await prisma.organization.upsert({
    where: { slug: 'northwind-health' },
    update: {},
    create: { name: 'Northwind Health System', slug: 'northwind-health' },
  });

  const [main, clinic] = await Promise.all(
    [
      { code: 'NWH-MAIN', name: 'Northwind General Hospital', city: 'Riverton', region: 'ZZ' },
      { code: 'NWH-EAST', name: 'Northwind East Clinic', city: 'Eastbrook', region: 'ZZ' },
    ].map((f) =>
      prisma.facility.upsert({
        where: { organizationId_code: { organizationId: org.id, code: f.code } },
        update: {},
        create: { ...f, organizationId: org.id, timezone: 'America/Chicago' },
      }),
    ),
  );

  const dept = await prisma.department.upsert({
    where: { facilityId_name: { facilityId: main.id, name: 'Care Coordination' } },
    update: {},
    create: { facilityId: main.id, name: 'Care Coordination', costCenter: 'CC-410' },
  });

  const people: { email: string; firstName: string; lastName: string; role: UserRole }[] = [
    { email: 'admin@clearpath.example', firstName: 'Ada', lastName: 'Whitfield', role: 'ADMIN' },
    { email: 'coordinator@clearpath.example', firstName: 'Marcus', lastName: 'Ibarra', role: 'COORDINATOR' },
    { email: 'clinician@clearpath.example', firstName: 'Priya', lastName: 'Raman', role: 'CLINICIAN' },
    { email: 'scheduler@clearpath.example', firstName: 'Tomasz', lastName: 'Lindqvist', role: 'SCHEDULER' },
    { email: 'beds@clearpath.example', firstName: 'Grace', lastName: 'Adeyemi', role: 'BED_MANAGER' },
    { email: 'analyst@clearpath.example', firstName: 'Jun', lastName: 'Kobayashi', role: 'ANALYST' },
    { email: 'auditor@clearpath.example', firstName: 'Elena', lastName: 'Petrova', role: 'AUDITOR' },
  ];
  const users = [];
  for (const p of people) {
    users.push(
      await prisma.user.upsert({ where: { email: p.email }, update: {}, create: { ...p, passwordHash, organizationId: org.id } }),
    );
  }
  const [admin, coordinator, clinician, scheduler] = users;

  const staffRows = [coordinator, clinician, scheduler];
  const staff = [];
  for (const [i, u] of staffRows.entries()) {
    staff.push(
      await prisma.staffMember.upsert({
        where: { userId: u.id },
        update: {},
        create: { userId: u.id, facilityId: main.id, departmentId: dept.id, jobTitle: ['Care coordinator', 'Hospitalist', 'Scheduling lead'][i], employeeCode: `E-${1000 + i}`, maxWeeklyHours: i === 1 ? 48 : 40 },
      }),
    );
  }

  const specialties = await Promise.all(
    [
      ['CARD', 'Cardiology'], ['ORTH', 'Orthopedics'], ['ENDO', 'Endocrinology'], ['NEUR', 'Neurology'], ['PULM', 'Pulmonology'],
    ].map(([code, name]) => prisma.specialty.upsert({ where: { code }, update: {}, create: { code, name } })),
  );

  const providerSeed = [
    { npi: '1234567893', firstName: 'Helena', lastName: 'Marsh', credentials: 'MD', spec: 0 },
    { npi: '1245319599', firstName: 'Deepak', lastName: 'Chandran', credentials: 'MD', spec: 1 },
    { npi: '1679576722', firstName: 'Sofia', lastName: 'Almeida', credentials: 'DO', spec: 2 },
    { npi: '1003000126', firstName: 'Owen', lastName: 'Gallagher', credentials: 'MD', spec: 3 },
  ];
  const providers = [];
  for (const p of providerSeed) {
    const { spec, ...data } = p;
    const provider = await prisma.provider.upsert({
      where: { npi: p.npi },
      update: {},
      create: { ...data, facilityId: clinic.id, email: `${p.lastName.toLowerCase()}@providers.example`, networkStatus: 'IN_NETWORK' },
    });
    await prisma.providerSpecialty.upsert({
      where: { providerId_specialtyId: { providerId: provider.id, specialtyId: specialties[spec].id } },
      update: {},
      create: { providerId: provider.id, specialtyId: specialties[spec].id, primary: true },
    });
    providers.push(provider);
  }

  const plan = await prisma.insurancePlan.upsert({
    where: { organizationId_planCode: { organizationId: org.id, planCode: 'PPO-GOLD' } },
    update: {},
    create: { organizationId: org.id, payerName: 'Evergreen Mutual', planName: 'Gold PPO', planCode: 'PPO-GOLD', requiresAuth: true },
  });

  const patientSeed = [
    ['MRN-100001-8', 'Nadia', 'Hargrove', '1958-03-14'],
    ['MRN-100002-6', 'Felix', 'Oyelaran', '1971-11-02'],
    ['MRN-100003-4', 'Imani', 'Castellano', '1949-07-29'],
    ['MRN-100004-2', 'Louis', 'Brandt', '1986-01-21'],
    ['MRN-100005-9', 'Yuki', 'Tanabe', '1964-09-08'],
    ['MRN-100006-7', 'Rosa', 'Delgado', '1992-05-17'],
  ];
  const patients = [];
  for (const [i, [mrn, firstName, lastName, dob]] of patientSeed.entries()) {
    const patient = await prisma.patient.upsert({
      where: { mrn },
      update: {},
      create: { mrn, firstName, lastName, dateOfBirth: new Date(dob), language: 'en', email: `${lastName.toLowerCase()}@patients.example` },
    });
    await prisma.coverage.upsert({
      where: { planId_memberId: { planId: plan.id, memberId: `MBR-${70000 + i}` } },
      update: {},
      create: { patientId: patient.id, planId: plan.id, memberId: `MBR-${70000 + i}`, effectiveFrom: new Date('2026-01-01') },
    });
    patients.push(patient);
  }

  const statuses = ['SUBMITTED', 'TRIAGED', 'SCHEDULED', 'SUBMITTED', 'COMPLETED', 'DRAFT'] as const;
  const priorities = ['ROUTINE', 'URGENT', 'ROUTINE', 'EMERGENT', 'ROUTINE', 'ROUTINE'] as const;
  for (const [i, patient] of patients.entries()) {
    await prisma.referral.upsert({
      where: { reference: `REF-2611-SEED0${i}` },
      update: {},
      create: {
        reference: `REF-2611-SEED0${i}`,
        patientId: patient.id,
        specialtyId: specialties[i % specialties.length].id,
        providerId: providers[i % providers.length].id,
        createdById: coordinator.id,
        status: statuses[i],
        priority: priorities[i],
        reason: ['Exertional chest pain', 'Knee pain, failed conservative care', 'Uncontrolled HbA1c', 'New-onset seizure', 'Chronic cough follow-up', 'Annual review'][i],
        scheduledAt: statuses[i] === 'SCHEDULED' ? daysFromNow(5) : null,
      },
    });
  }

  const coverage = await prisma.coverage.findFirstOrThrow({ where: { patientId: patients[0].id } });
  await prisma.priorAuthorization.upsert({
    where: { reference: 'PA-2026-SEED001' },
    update: {},
    create: { reference: 'PA-2026-SEED001', patientId: patients[0].id, coverageId: coverage.id, requestedById: clinician.id, serviceCode: '93306', serviceDescription: 'Echocardiography, complete', status: 'APPROVED', validFrom: new Date(), validUntil: daysFromNow(5), decidedAt: new Date() },
  });

  const pathway = await prisma.carePathway.upsert({
    where: { code: 'HF-30D' },
    update: {},
    create: {
      code: 'HF-30D', name: 'Heart failure 30-day transition', specialtyId: specialties[0].id, published: true,
      steps: { create: [
        { position: 1, title: 'Discharge medication reconciliation', dueAfterDays: 1 },
        { position: 2, title: 'Follow-up call', dueAfterDays: 2 },
        { position: 3, title: 'Cardiology visit', dueAfterDays: 7, requiresAuth: true },
      ] },
    },
  });
  await prisma.pathwayEnrollment.upsert({
    where: { patientId_pathwayId: { patientId: patients[2].id, pathwayId: pathway.id } },
    update: {},
    create: { patientId: patients[2].id, pathwayId: pathway.id },
  });

  const ward = await prisma.ward.upsert({
    where: { facilityId_name: { facilityId: main.id, name: 'North 3 Medical' } },
    update: {},
    create: { facilityId: main.id, name: 'North 3 Medical', type: 'MEDICAL', floor: 3 },
  });
  for (let n = 1; n <= 12; n++) {
    await prisma.bed.upsert({
      where: { wardId_label: { wardId: ward.id, label: `3${String(n).padStart(2, '0')}A` } },
      update: {},
      create: { wardId: ward.id, label: `3${String(n).padStart(2, '0')}A`, isolation: n % 6 === 0, telemetry: n % 3 === 0, status: n <= 8 ? 'OCCUPIED' : n === 12 ? 'BLOCKED' : 'AVAILABLE' },
    });
  }

  for (const [i, s] of staff.entries()) {
    const start = new Date(Date.UTC(2026, 10, 16 + i, 7, 0, 0));
    await prisma.shift.create({ data: { staffId: s.id, startsAt: start, endsAt: new Date(start.getTime() + 8 * HOUR), role: 'Day shift', status: 'CONFIRMED' } });
  }

  const board = await prisma.taskBoard.create({ data: { name: 'Discharge planning', departmentId: dept.id, slaHours: 24 } });
  await prisma.task.createMany({
    data: [
      { boardId: board.id, patientId: patients[2].id, reporterId: coordinator.id, assigneeId: clinician.id, title: 'Arrange home health intake', priority: 'HIGH', dueAt: daysFromNow(1) },
      { boardId: board.id, patientId: patients[0].id, reporterId: coordinator.id, title: 'Confirm echo authorization on file', priority: 'NORMAL', dueAt: daysFromNow(2) },
      { boardId: board.id, reporterId: admin.id, title: 'Review blocked bed 312A', priority: 'LOW', status: 'IN_PROGRESS' },
    ],
  });

  console.log(`Seeded organization ${org.slug}: ${users.length} users, ${patients.length} patients, ${providers.length} providers.`);
  console.log('All seeded accounts use the password "Example-Passw0rd!" and *.example email addresses.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
