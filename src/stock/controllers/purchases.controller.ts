import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { PurchasesService } from '../services/purchases.service';
import { CancelPurchaseDto, CreatePurchaseDto } from '../dto/purchase.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('purchases')
export class PurchasesController {
  constructor(private service: PurchasesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePurchaseDto, @Req() req: any) {
    return this.service.create(dto, req.user);
  }

  @Post(':id/annuler')
  cancel(@Param('id') id: string, @Body() dto: CancelPurchaseDto) {
    return this.service.cancel(id, dto);
  }
}