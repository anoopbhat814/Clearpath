import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/pagination.dto';

export class CreateStaffMemberDto {
  @IsString()
  @MaxLength(500)
  userId!: string;

  @IsString()
  @MaxLength(500)
  facilityId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  departmentId?: string;

  @IsString()
  @MaxLength(500)
  jobTitle!: string;

  @IsString()
  @MaxLength(500)
  employeeCode!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxWeeklyHours?: number;
}

export class UpdateStaffMemberDto extends PartialType(CreateStaffMemberDto) {}

export class ListStaffMemberQuery extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  facilityId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;
}
