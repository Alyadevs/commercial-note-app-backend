import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateCreditDto {
  @IsNotEmpty() @IsString()
  clientId: string;

  @IsNumber() @Min(0.01)
  montant: number;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsDateString()
  dateEcheance?: string;
}
