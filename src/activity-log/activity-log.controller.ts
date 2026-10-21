import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

// Journal des actions des commerciaux : réservé à l'admin (supervision)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('activity-log')
export class ActivityLogController {
  constructor(private activityLogService: ActivityLogService) {}

  @Get()
  findAll(@Query('commercialId') commercialId?: string, @Query('limit') limit?: string) {
    return this.activityLogService.findAll({
      commercialId,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
