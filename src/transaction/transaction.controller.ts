import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/transaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // adapte selon ton guard réel

@UseGuards(JwtAuthGuard)
@Controller('clients/:clientId/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionService) {}

  @Get()
  findAll(@Param('clientId') clientId: string, @Req() req: any) {
    return this.transactionsService.findAllForClient(clientId, req.user);
  }

  @Post()
  create(
    @Param('clientId') clientId: string,
    @Body() dto: CreateTransactionDto,
    @Req() req: any,
  ) {
    return this.transactionsService.create(clientId, dto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.transactionsService.remove(id, req.user);
  }
}