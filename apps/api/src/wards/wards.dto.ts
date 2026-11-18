import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { WardType } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination.dto';

export class CreateWardDto {
  @IsString()
  @MaxLength(500)
  facilityId!: string;

  @IsString()
  @MaxLength(500)
  name!: string;

  @IsOptional()
  @IsEnum(WardType)
  type?: WardType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  floor?: number;
}

export class UpdateWardDto extends PartialType(CreateWardDto) {}

export class ListWardQuery extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  facilityId?: string;

  @IsOptional()
  @IsEnum(WardType)
  type?: WardType;
}
