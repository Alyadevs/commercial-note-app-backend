import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { TransfersService } from '../services/transfers.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('commercial')
@Controller('my-stock')
export class MyStockController {
  constructor(private service: TransfersService) {}

  @Get()
  get(@Req() req: any) {
    return this.service.myStock(req.user.userId);
  }
}