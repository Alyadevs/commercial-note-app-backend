import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TransactionService } from './transaction.service';

// Réservé à l'admin : transactions de tous les clients d'un commercial
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/commerciaux/:commercialId/transactions')
export class AdminTransactionsController {
  constructor(private readonly transactionsService: TransactionService) {}

  @Get()
  findAll(@Param('commercialId') commercialId: string) {
    return this.transactionsService.findAllForCommercial(commercialId);
  }
}