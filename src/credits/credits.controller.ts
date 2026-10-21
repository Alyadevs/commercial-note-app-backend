import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CreditsService } from './credits.service';
import { CreateCreditDto } from './dto/create-credit.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('credits')
export class CreditsController {
  constructor(private creditsService: CreditsService) {}

  @Post()
  create(@Body() dto: CreateCreditDto, @Req() req: any) {
    return this.creditsService.create(dto, req.user);
  }

  @Get()
  findAll(
    @Req() req: any,
    @Query('clientId') clientId?: string,
    @Query('commercialId') commercialId?: string,
    @Query('statut') statut?: string,
  ) {
    return this.creditsService.findAll(req.user, { clientId, commercialId, statut });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.creditsService.findOne(id, req.user);
  }
}
