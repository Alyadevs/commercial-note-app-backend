import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Post()
  create(@Body() dto: CreateClientDto, @Req() req: any) {
    return this.clientsService.create(dto, req.user);
  }

  @Get()
  findAll(@Req() req: any, @Query('commercialId') commercialId?: string) {
    return this.clientsService.findAll(req.user, commercialId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.clientsService.findOne(id, req.user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateClientDto>, @Req() req: any) {
    return this.clientsService.update(id, dto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.clientsService.remove(id, req.user);
  }
}
