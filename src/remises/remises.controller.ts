import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { RemisesService } from './remises.service';
import { CreateRemiseDto } from './dto/create-remise.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('remises')
export class RemisesController {
  constructor(private remisesService: RemisesService) {}

  @Post()
  create(@Body() dto: CreateRemiseDto, @Req() req: any) {
    return this.remisesService.create(dto, req.user);
  }

  @Get()
  findAll(@Req() req: any, @Query('clientId') clientId?: string, @Query('commercialId') commercialId?: string) {
    return this.remisesService.findAll(req.user, { clientId, commercialId });
  }
}
