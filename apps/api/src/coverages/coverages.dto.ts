import { IsBoolean, IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/pagination.dto';

export class CreateCoverageDto {
  @IsString()
  @MaxLength(500)
  patientId!: string;

  @IsString()
  @MaxLength(500)
  planId!: string;

  @IsString()
  @MaxLength(500)
  memberId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  groupNumber?: string;

  @IsDateString()
  effectiveFrom!: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @IsOptional()
  @IsBoolean()
  primary?: boolean;
}

export class UpdateCoverageDto extends PartialType(CreateCoverageDto) {}

export class ListCoverageQuery extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsString()
  planId?: string;
}
