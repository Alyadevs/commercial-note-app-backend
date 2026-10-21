import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Credit, CreditSchema } from './schemas/credit.schema';
import { CreditsService } from './credits.service';
import { CreditsController } from './credits.controller';
import { ClientsModule } from '../clients/clients.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Credit.name, schema: CreditSchema }]),
    ClientsModule,
    ActivityLogModule,
  ],
  controllers: [CreditsController],
  providers: [CreditsService],
  exports: [CreditsService],
})
export class CreditsModule {}
