import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/pagination.dto';

export class CreateCarePathwayDto {
  @IsString()
  @MaxLength(500)
  code!: string;

  @IsString()
  @MaxLength(500)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  specialtyId?: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class UpdateCarePathwayDto extends PartialType(CreateCarePathwayDto) {}

export class ListCarePathwayQuery extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsString()
  specialtyId?: string;
}

export class AddStepDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  position!: number;

  @IsString()
  @MaxLength(500)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  dueAfterDays?: number;

  @IsOptional()
  @IsBoolean()
  requiresAuth?: boolean;
}

export class EnrollPatientDto {
  @IsString()
  patientId!: string;
}
