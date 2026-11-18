import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/pagination.dto';

export class CreateFacilityDto {
  @IsString()
  @MaxLength(500)
  name!: string;

  @IsString()
  @MaxLength(500)
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  addressLine?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  timezone?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateFacilityDto extends PartialType(CreateFacilityDto) {}

export class ListFacilityQuery extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  active?: boolean;
}
