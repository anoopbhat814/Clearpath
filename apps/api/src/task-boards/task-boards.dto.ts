import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/pagination.dto';

export class CreateTaskBoardDto {
  @IsString()
  @MaxLength(500)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  departmentId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  slaHours?: number;
}

export class UpdateTaskBoardDto extends PartialType(CreateTaskBoardDto) {}

export class ListTaskBoardQuery extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  departmentId?: string;
}
