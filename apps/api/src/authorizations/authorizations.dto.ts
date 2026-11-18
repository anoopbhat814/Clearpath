import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { AuthStatus } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination.dto';

export class CreatePriorAuthorizationDto {
  @IsString()
  @MaxLength(500)
  patientId!: string;

  @IsString()
  @MaxLength(500)
  coverageId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  referralId?: string;

  @IsString()
  @MaxLength(500)
  serviceCode!: string;

  @IsString()
  @MaxLength(500)
  serviceDescription!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  units?: number;
}

export class UpdatePriorAuthorizationDto extends PartialType(CreatePriorAuthorizationDto) {}

export class ListPriorAuthorizationQuery extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(AuthStatus)
  status?: AuthStatus;

  @IsOptional()
  @IsString()
  patientId?: string;
}

export class TransitionAuthorizationDto {
  @IsEnum(AuthStatus)
  status!: AuthStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  denialReason?: string;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
