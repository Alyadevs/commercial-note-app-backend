import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from './schema/category.schema';
import { Product, ProductSchema } from './schema/product.schema';
import { StockMovement, StockMovementSchema } from './schema/stock-movement.schema';
import { CategoriesController } from './controllers/categories.controller';
import { ProductsController } from './controllers/products.controller';
import { CategoriesService } from './services/categories.service';
import { ProductsService } from './services/products.service';
import { Invoice, InvoiceSchema } from './schema/invoice.schema';
import { Counter, CounterSchema } from './schema/counter.schema';
import { InvoicesController } from './controllers/invoices.controller';
import { InvoicesService } from './services/invoices.service';
import { InvoicePayment, InvoicePaymentSchema } from './schema/invoice-payment.schema';
import { PurchasesController } from './controllers/purchases.controller';
import { PurchasesService } from './services/purchases.service';
import { Purchase, PurchaseSchema } from './schema/purchase.schema';
import { Transfer, TransferSchema } from './schema/transfer.schema';
import { CommercialStock, CommercialStockSchema } from './schema/commercial-stock.schema';
import { TransfersController } from './controllers/transfers.controller';
import { TransfersService } from './services/transfers.service';
import { User, UserSchema } from 'src/users/schemas/user.schema';
import { MyStockController } from './controllers/my-stock.controller';
import { Client, ClientSchema } from 'src/clients/schemas/client.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Product.name, schema: ProductSchema },
      { name: StockMovement.name, schema: StockMovementSchema },
       { name: Invoice.name, schema: InvoiceSchema },
      { name: Counter.name, schema: CounterSchema },
      { name: InvoicePayment.name, schema: InvoicePaymentSchema },
       { name: Purchase.name, schema: PurchaseSchema },
       { name: Transfer.name, schema: TransferSchema },
      { name: CommercialStock.name, schema: CommercialStockSchema },
      { name: User.name, schema: UserSchema },
      { name: Client.name, schema: ClientSchema },
    ]),
  ],
controllers: [CategoriesController, ProductsController, InvoicesController,PurchasesController,TransfersController,MyStockController,],
providers: [CategoriesService, ProductsService, InvoicesService,PurchasesService,TransfersService,],
})
export class StockModule {}