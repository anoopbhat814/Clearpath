import { IsString, MaxLength } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/pagination.dto';

export class CreateSpecialtyDto {
  @IsString()
  @MaxLength(500)
  code!: string;

  @IsString()
  @MaxLength(500)
  name!: string;
}

export class UpdateSpecialtyDto extends PartialType(CreateSpecialtyDto) {}

export class ListSpecialtyQuery extends PaginationQueryDto {}
