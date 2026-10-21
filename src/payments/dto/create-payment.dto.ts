import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsNotEmpty() @IsString()
  clientId: string;

  @IsOptional() @IsString()
  creditId?: string;

  @IsNumber() @Min(0.01)
  montant: number;

  @IsOptional() @IsString()
  note?: string;
}
