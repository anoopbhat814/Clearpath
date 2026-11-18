import { IsDateString, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/pagination.dto';

export class CreatePatientDto {
  @IsString()
  @MaxLength(500)
  mrn!: string;

  @IsString()
  @MaxLength(500)
  firstName!: string;

  @IsString()
  @MaxLength(500)
  lastName!: string;

  @IsDateString()
  dateOfBirth!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  sex?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  language?: string;
}

export class UpdatePatientDto extends PartialType(CreatePatientDto) {}

export class ListPatientQuery extends PaginationQueryDto {}
