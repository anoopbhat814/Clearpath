import { Module } from '@nestjs/common';
import { TaskBoardController } from './task-boards.controller';
import { TaskBoardService } from './task-boards.service';

@Module({
  controllers: [TaskBoardController],
  providers: [TaskBoardService],
  exports: [TaskBoardService],
})
export class TaskBoardModule {}
