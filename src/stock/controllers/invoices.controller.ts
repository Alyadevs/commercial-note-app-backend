import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { InvoicesService } from '../services/invoices.service';
import { CancelInvoiceDto, CreateInvoiceDto, PayInvoiceDto } from '../dto/invoice.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'commercial')
@Controller('invoices')
export class InvoicesController {
  constructor(private service: InvoicesService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.service.findOne(id, req.user);
  }

  @Post()
  create(@Body() dto: CreateInvoiceDto, @Req() req: any) {
    return this.service.create(dto, req.user);
  }

  @Post(':id/payments')
  pay(@Param('id') id: string, @Body() dto: PayInvoiceDto, @Req() req: any) {
    return this.service.pay(id, dto, req.user);
  }

  @Get(':id/payments')
  payments(@Param('id') id: string, @Req() req: any) {
    return this.service.payments(id, req.user);
  }

  @Post(':id/annuler')
  cancel(@Param('id') id: string, @Body() dto: CancelInvoiceDto, @Req() req: any) {
    return this.service.cancel(id, dto, req.user);
  }
}