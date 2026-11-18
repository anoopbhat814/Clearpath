import { Controller, Get, Header, Param, Query, StreamableFile } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuditService } from './audit.service';
import { ExportAuditQuery, ListAuditQuery } from './audit.dto';

@ApiTags('audit')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.AUDITOR)
@Controller('audit')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get()
  list(@Query() query: ListAuditQuery) {
    return this.service.list(query);
  }

  @Get('export')
  @Header('content-type', 'text/csv; charset=utf-8')
  @Header('content-disposition', 'attachment; filename="audit-export.csv"')
  async export(@Query() query: ExportAuditQuery, @CurrentUser('id') actorId: string) {
    return new StreamableFile(Buffer.from(await this.service.exportCsv(query, actorId)));
  }

  @Get('entity/:type/:id')
  history(@Param('type') type: string, @Param('id') id: string) {
    return this.service.entityHistory(type, id);
  }
}
