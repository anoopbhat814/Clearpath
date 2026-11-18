-- Migration: referrals pathways authorizations

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "mrn" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "sex" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "deceased" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coverages" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "groupNumber" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "primary" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "coverages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "originFacilityId" TEXT,
    "destinationFacilityId" TEXT,
    "providerId" TEXT,
    "specialtyId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" "ReferralPriority" NOT NULL DEFAULT 'ROUTINE',
    "reason" TEXT NOT NULL,
    "clinicalSummary" TEXT,
    "requestedFor" TIMESTAMP(3),
    "triagedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_notes" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "internal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "referral_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_pathways" (
    "id" TEXT NOT NULL,
    "specialtyId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "care_pathways_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pathway_steps" (
    "id" TEXT NOT NULL,
    "pathwayId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueAfterDays" INTEGER NOT NULL DEFAULT 7,
    "requiresAuth" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "pathway_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pathway_enrollments" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "pathwayId" TEXT NOT NULL,
    "status" "PathwayStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "pathway_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prior_authorizations" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "coverageId" TEXT NOT NULL,
    "referralId" TEXT,
    "requestedById" TEXT NOT NULL,
    "serviceCode" TEXT NOT NULL,
    "serviceDescription" TEXT NOT NULL,
    "status" "AuthStatus" NOT NULL DEFAULT 'PENDING',
    "units" INTEGER NOT NULL DEFAULT 1,
    "submittedAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "denialReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "prior_authorizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authorization_events" (
    "id" TEXT NOT NULL,
    "authorizationId" TEXT NOT NULL,
    "actorId" TEXT,
    "fromStatus" "AuthStatus",
    "toStatus" "AuthStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "authorization_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patients_mrn_key" ON "patients"("mrn");
CREATE INDEX "patients_lastName_firstName_idx" ON "patients"("lastName", "firstName");
CREATE INDEX "patients_dateOfBirth_idx" ON "patients"("dateOfBirth");
CREATE UNIQUE INDEX "coverages_planId_memberId_key" ON "coverages"("planId", "memberId");
CREATE INDEX "coverages_patientId_idx" ON "coverages"("patientId");
CREATE UNIQUE INDEX "referrals_reference_key" ON "referrals"("reference");
CREATE INDEX "referrals_status_priority_createdAt_idx" ON "referrals"("status", "priority", "createdAt");
CREATE INDEX "referrals_patientId_idx" ON "referrals"("patientId");
CREATE INDEX "referrals_providerId_scheduledAt_idx" ON "referrals"("providerId", "scheduledAt");
CREATE INDEX "referral_notes_referralId_createdAt_idx" ON "referral_notes"("referralId", "createdAt");
CREATE UNIQUE INDEX "care_pathways_code_key" ON "care_pathways"("code");
CREATE UNIQUE INDEX "pathway_steps_pathwayId_position_key" ON "pathway_steps"("pathwayId", "position");
CREATE UNIQUE INDEX "pathway_enrollments_patientId_pathwayId_key" ON "pathway_enrollments"("patientId", "pathwayId");
CREATE INDEX "pathway_enrollments_status_idx" ON "pathway_enrollments"("status");
CREATE UNIQUE INDEX "prior_authorizations_reference_key" ON "prior_authorizations"("reference");
CREATE INDEX "prior_authorizations_status_validUntil_idx" ON "prior_authorizations"("status", "validUntil");
CREATE INDEX "prior_authorizations_patientId_idx" ON "prior_authorizations"("patientId");
CREATE INDEX "authorization_events_authorizationId_createdAt_idx" ON "authorization_events"("authorizationId", "createdAt");

-- AddForeignKey
ALTER TABLE "coverages" ADD CONSTRAINT "coverages_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "coverages" ADD CONSTRAINT "coverages_planId_fkey" FOREIGN KEY ("planId") REFERENCES "insurance_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_originFacilityId_fkey" FOREIGN KEY ("originFacilityId") REFERENCES "facilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_destinationFacilityId_fkey" FOREIGN KEY ("destinationFacilityId") REFERENCES "facilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "specialties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "referral_notes" ADD CONSTRAINT "referral_notes_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "referrals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "referral_notes" ADD CONSTRAINT "referral_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "care_pathways" ADD CONSTRAINT "care_pathways_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "specialties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pathway_steps" ADD CONSTRAINT "pathway_steps_pathwayId_fkey" FOREIGN KEY ("pathwayId") REFERENCES "care_pathways"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pathway_enrollments" ADD CONSTRAINT "pathway_enrollments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pathway_enrollments" ADD CONSTRAINT "pathway_enrollments_pathwayId_fkey" FOREIGN KEY ("pathwayId") REFERENCES "care_pathways"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prior_authorizations" ADD CONSTRAINT "prior_authorizations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prior_authorizations" ADD CONSTRAINT "prior_authorizations_coverageId_fkey" FOREIGN KEY ("coverageId") REFERENCES "coverages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prior_authorizations" ADD CONSTRAINT "prior_authorizations_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "referrals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "prior_authorizations" ADD CONSTRAINT "prior_authorizations_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "authorization_events" ADD CONSTRAINT "authorization_events_authorizationId_fkey" FOREIGN KEY ("authorizationId") REFERENCES "prior_authorizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "authorization_events" ADD CONSTRAINT "authorization_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
