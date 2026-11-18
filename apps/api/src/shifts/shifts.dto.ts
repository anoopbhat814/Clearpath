import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { ShiftStatus } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination.dto';

export class CreateShiftDto {
  @IsString()
  @MaxLength(500)
  staffId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  providerId?: string;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  role?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateShiftDto extends PartialType(CreateShiftDto) {}

export class ListShiftQuery extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  staffId?: string;

  @IsOptional()
  @IsEnum(ShiftStatus)
  status?: ShiftStatus;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
