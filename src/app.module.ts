import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ClientsModule } from './clients/clients.module';
import { CreditsModule } from './credits/credits.module';
import { PaymentsModule } from './payments/payments.module';
import { RemisesModule } from './remises/remises.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { UsersService } from './users/users.service';
import { TransactionsModule } from './transaction/transaction.module';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://ichaouialya_db_user:alya123456@ac-y6d2fse-shard-00-00.2vwdg0q.mongodb.net:27017,ac-y6d2fse-shard-00-01.2vwdg0q.mongodb.net:27017,ac-y6d2fse-shard-00-02.2vwdg0q.mongodb.net:27017/?ssl=true&replicaSet=atlas-vzcv6u-shard-0&authSource=admin&appName=Cluster0',
    ),
    AuthModule,
    UsersModule,
    ClientsModule,
    CreditsModule,
    PaymentsModule,
    RemisesModule,
    ActivityLogModule,
    TransactionsModule,
    ProfileModule,
    
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private usersService: UsersService) {}

  // Crée un compte admin par défaut au premier démarrage si aucun admin n'existe
  async onModuleInit() {
    await this.usersService.ensureDefaultAdmin(
      process.env.ADMIN_EMAIL || 'admin@example.com',
      process.env.ADMIN_PASSWORD || 'Admin123!',
    );
  }
}
