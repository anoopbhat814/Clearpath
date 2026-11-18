import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/pagination.dto';

export class CreateInsurancePlanDto {
  @IsString()
  @MaxLength(500)
  payerName!: string;

  @IsString()
  @MaxLength(500)
  planName!: string;

  @IsString()
  @MaxLength(500)
  planCode!: string;

  @IsOptional()
  @IsBoolean()
  requiresAuth?: boolean;
}

export class UpdateInsurancePlanDto extends PartialType(CreateInsurancePlanDto) {}

export class ListInsurancePlanQuery extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  requiresAuth?: boolean;
}
