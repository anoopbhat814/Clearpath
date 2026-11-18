import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { NetworkStatus } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination.dto';

export class CreateProviderDto {
  @IsString()
  @MaxLength(500)
  npi!: string;

  @IsString()
  @MaxLength(500)
  firstName!: string;

  @IsString()
  @MaxLength(500)
  lastName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  credentials?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  phone?: string;

  @IsOptional()
  @IsEnum(NetworkStatus)
  networkStatus?: NetworkStatus;

  @IsOptional()
  @IsBoolean()
  acceptingNew?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  facilityId?: string;
}

export class UpdateProviderDto extends PartialType(CreateProviderDto) {}

export class ListProviderQuery extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(NetworkStatus)
  networkStatus?: NetworkStatus;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  acceptingNew?: boolean;

  @IsOptional()
  @IsString()
  facilityId?: string;

  @IsOptional()
  @IsString()
  specialtyCode?: string;
}

export class AssignSpecialtyDto {
  @IsString()
  specialtyId!: string;

  @IsOptional()
  @IsBoolean()
  primary?: boolean;
}
