import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { TransactionType } from '../schemas/transaction.schema';

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsNumber()
  @Min(0.01)
  montant?: number;

  @IsOptional()
  @IsString()
  description?: string;
}