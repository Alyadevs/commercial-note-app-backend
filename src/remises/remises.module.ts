import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Remise, RemiseSchema } from './schemas/remise.schema';
import { RemisesService } from './remises.service';
import { RemisesController } from './remises.controller';
import { ClientsModule } from '../clients/clients.module';
import { CreditsModule } from '../credits/credits.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Remise.name, schema: RemiseSchema }]),
    ClientsModule,
    CreditsModule,
    ActivityLogModule,
  ],
  controllers: [RemisesController],
  providers: [RemisesService],
  exports: [RemisesService],
})
export class RemisesModule {}
