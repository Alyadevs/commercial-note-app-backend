import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';
import { TransactionService } from './transaction.service';
import { TransactionsController } from './transaction.controller';
import { ClientsModule } from '../clients/clients.module';
import { Credit, CreditSchema } from 'src/credits/schemas/credit.schema';
import { Payment, PaymentSchema } from 'src/payments/schemas/payment.schema';
import { Remise, RemiseSchema } from 'src/remises/schemas/remise.schema';
import { AdminTransactionsController } from './admin-transactions.controller';
import { Client, ClientSchema } from 'src/clients/schemas/client.schema';

@Module({
  imports: [
  MongooseModule.forFeature([
  { name: Transaction.name, schema: TransactionSchema },
  { name: Credit.name, schema: CreditSchema },
  { name: Payment.name, schema: PaymentSchema },
  { name: Remise.name, schema: RemiseSchema },
  { name: Client.name, schema: ClientSchema },
]),
    ClientsModule,
  ],
  controllers: [TransactionsController,AdminTransactionsController],
  providers: [TransactionService],
  exports: [TransactionService],
})
export class TransactionsModule {}