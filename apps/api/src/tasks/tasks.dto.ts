import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { PaginationQueryDto } from '../common/pagination.dto';

export class CreateTaskDto {
  @IsString()
  @MaxLength(500)
  boardId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  patientId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  assigneeId?: string;

  @IsString()
  @MaxLength(500)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsDateString()
  dueAt?: string;
}

export class UpdateTaskDto extends PartialType(CreateTaskDto) {}

export class ListTaskQuery extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  boardId?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsString()
  assigneeId?: string;
}

export class MoveTaskDto {
  @IsEnum(TaskStatus)
  status!: TaskStatus;
}

export class AddTaskCommentDto {
  @IsString()
  @MaxLength(2000)
  body!: string;
}
