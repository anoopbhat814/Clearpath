import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { ReferralPriority, ReferralStatus } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination.dto';

export class CreateReferralDto {
  @IsString()
  @MaxLength(500)
  patientId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  originFacilityId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  destinationFacilityId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  providerId?: string;

  @IsString()
  @MaxLength(500)
  specialtyId!: string;

  @IsOptional()
  @IsEnum(ReferralPriority)
  priority?: ReferralPriority;

  @IsString()
  @MaxLength(500)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  clinicalSummary?: string;

  @IsOptional()
  @IsDateString()
  requestedFor?: string;
}

export class UpdateReferralDto extends PartialType(CreateReferralDto) {}

export class ListReferralQuery extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ReferralStatus)
  status?: ReferralStatus;

  @IsOptional()
  @IsEnum(ReferralPriority)
  priority?: ReferralPriority;

  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsString()
  providerId?: string;
}

export class TransitionReferralDto {
  @IsEnum(ReferralStatus)
  status!: ReferralStatus;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  providerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class AddReferralNoteDto {
  @IsString()
  @MaxLength(2000)
  body!: string;

  @IsOptional()
  @IsBoolean()
  internal?: boolean;
}
