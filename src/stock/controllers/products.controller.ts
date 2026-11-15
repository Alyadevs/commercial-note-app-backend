import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { ProductsService } from '../services/products.service';
import { AdjustStockDto, ProductDto } from '../dto/product.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('products')
export class ProductsController {
  constructor(private service: ProductsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() dto: ProductDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: ProductDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/stock')
  adjust(@Param('id') id: string, @Body() dto: AdjustStockDto) {
    return this.service.adjustStock(id, dto);
  }

  @Get(':id/movements')
  movements(@Param('id') id: string) {
    return this.service.movements(id);
  }
}