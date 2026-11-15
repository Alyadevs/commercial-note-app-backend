import { Type } from 'class-transformer';
import {
  ArrayMinSize, IsArray, IsDateString, IsIn, IsMongoId, IsNotEmpty,
  IsNumber, IsOptional, IsString, Min, ValidateNested,
} from 'class-validator';

export class InvoiceLineDto {
  @IsMongoId()
  produit!: string;

  @IsNumber()
  @Min(0.001)
  quantite!: number;

  // Si absent, on prend le prix de vente actuel du produit
  @IsOptional()
  @IsNumber()
  @Min(0)
  prixUnitaire?: number;
}

export class CreateInvoiceDto {
  @IsOptional()
  @IsMongoId()
  client?: string;

  @IsString()
  @IsNotEmpty()
  clientNom!: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineDto)
  lignes!: InvoiceLineDto[];
  @IsOptional()
@IsIn(['pourcentage', 'montant'])
remiseType?: 'pourcentage' | 'montant';

@IsOptional()
@IsNumber()
@Min(0)
remiseValeur?: number;
}
export class PayInvoiceDto {
  @IsNumber()
  @Min(0.01)
  montant!: number;

  @IsOptional()
  @IsIn(['especes', 'cheque', 'virement', 'autre'])
  mode?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
export class CancelInvoiceDto {
  @IsOptional()
  @IsString()
  motif?: string;
}