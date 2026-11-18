import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { BedStatus } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination.dto';

export class CreateBedDto {
  @IsString()
  @MaxLength(500)
  wardId!: string;

  @IsString()
  @MaxLength(500)
  label!: string;

  @IsOptional()
  @IsBoolean()
  isolation?: boolean;

  @IsOptional()
  @IsBoolean()
  telemetry?: boolean;
}

export class UpdateBedDto extends PartialType(CreateBedDto) {}

export class ListBedQuery extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  wardId?: string;

  @IsOptional()
  @IsEnum(BedStatus)
  status?: BedStatus;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isolation?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  telemetry?: boolean;
}

export class AdmitPatientDto {
  @IsString()
  patientId!: string;

  @IsOptional()
  @IsDateString()
  expectedDischarge?: string;
}

export class SetBedStatusDto {
  @IsEnum(BedStatus)
  status!: BedStatus;
}
