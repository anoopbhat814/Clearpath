import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { skipTake, toPage } from '../common/paginate';
import type { AuthUser } from '../common/types';
import { CreateCarePathwayDto, UpdateCarePathwayDto, ListCarePathwayQuery } from './pathways.dto';
import { nextPosition } from './pathway-progress';
import { AddStepDto, EnrollPatientDto } from './pathways.dto';

@Injectable()
export class CarePathwayService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListCarePathwayQuery, user: AuthUser) {
    const where: Prisma.CarePathwayWhereInput = {};
    if (query.published !== undefined) where.published = query.published;
    if (query.specialtyId !== undefined) where.specialtyId = query.specialtyId;
    if (query.q) {
      where.OR = [{ name: { contains: query.q, mode: 'insensitive' } }, { code: { contains: query.q, mode: 'insensitive' } }];
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.carePathway.findMany({
        where,
        ...skipTake(query.page, query.pageSize),
        orderBy: { name: 'asc' },
        include: { steps: { orderBy: { position: 'asc' } } },
      }),
      this.prisma.carePathway.count({ where }),
    ]);
    return toPage(items, total, query.page, query.pageSize);
  }

  async get(id: string, user: AuthUser) {
    const row = await this.prisma.carePathway.findFirst({
      where: { id },
      include: { steps: { orderBy: { position: 'asc' } } },
    });
    if (!row) throw new NotFoundException('CarePathway not found');
    return row;
  }

  async create(dto: CreateCarePathwayDto, user: AuthUser) {
    return this.prisma.carePathway.create({ data: { ...dto } });
  }

  async update(id: string, dto: UpdateCarePathwayDto, user: AuthUser) {
    await this.get(id, user);
    return this.prisma.carePathway.update({ where: { id }, data: dto });
  }

  async addStep(id: string, dto: AddStepDto, user: AuthUser) {
    await this.get(id, user);
    return this.prisma.pathwayStep.create({ data: { ...dto, pathwayId: id } });
  }

  async enroll(id: string, dto: EnrollPatientDto, user: AuthUser) {
    const pathway = await this.get(id, user);
    if (!pathway.published) throw new BadRequestException('Pathway is not published');
    if (pathway.steps.length === 0) throw new BadRequestException('Pathway has no steps');
    return this.prisma.pathwayEnrollment.create({
      data: { patientId: dto.patientId, pathwayId: id, currentStep: pathway.steps[0].position },
    });
  }

  /** Moves an enrollment to the next step, completing it after the last one. */
  async advance(enrollmentId: string) {
    const enrollment = await this.prisma.pathwayEnrollment.findUnique({
      where: { id: enrollmentId },
      include: { pathway: { include: { steps: true } } },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    if (enrollment.status !== 'ACTIVE') throw new BadRequestException('Enrollment is not active');
    const next = nextPosition(enrollment.currentStep, enrollment.pathway.steps);
    return this.prisma.pathwayEnrollment.update({
      where: { id: enrollmentId },
      data: next === null ? { status: 'COMPLETED', completedAt: new Date() } : { currentStep: next },
    });
  }
}
