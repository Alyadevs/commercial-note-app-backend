import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post()
  create(@Body() dto: CreatePaymentDto, @Req() req: any) {
    return this.paymentsService.create(dto, req.user);
  }

  @Get()
  findAll(@Req() req: any, @Query('clientId') clientId?: string, @Query('commercialId') commercialId?: string) {
    return this.paymentsService.findAll(req.user, { clientId, commercialId });
  }
}
