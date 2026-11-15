import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { TransfersService } from '../services/transfers.service';
import { CancelTransferDto, CreateTransferDto } from '../dto/transfer.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('transfers')
export class TransfersController {
  constructor(private service: TransfersService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  // Avant ':id', sinon "stock" serait pris pour un identifiant
  @Get('stock')
  stock() {
    return this.service.stock();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTransferDto, @Req() req: any) {
    return this.service.create(dto, req.user);
  }

  @Post(':id/annuler')
  cancel(@Param('id') id: string, @Body() dto: CancelTransferDto) {
    return this.service.cancel(id, dto);
  }
}