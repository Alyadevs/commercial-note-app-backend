import { Type } from 'class-transformer';
import {
  ArrayMinSize, IsArray, IsDateString, IsMongoId, IsNotEmpty,
  IsNumber, IsOptional, IsString, Min, ValidateNested,
} from 'class-validator';

export class PurchaseLineDto {
  @IsMongoId()
  produit!: string;

  @IsNumber()
  @Min(0.001)
  quantite!: number;

  @IsNumber()
  @Min(0)
  prixAchat!: number;

  @IsNumber()
  @Min(0)
  prixVente!: number;
}

export class CreatePurchaseDto {
  @IsString()
  @IsNotEmpty()
  fournisseur!: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseLineDto)
  lignes!: PurchaseLineDto[];
}

export class CancelPurchaseDto {
  @IsOptional()
  @IsString()
  motif?: string;
}