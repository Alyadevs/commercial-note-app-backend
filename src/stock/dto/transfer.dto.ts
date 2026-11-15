import { Type } from 'class-transformer';
import {
  ArrayMinSize, IsArray, IsDateString, IsMongoId,
  IsNumber, IsOptional, IsString, Min, ValidateNested,
} from 'class-validator';

export class TransferLineDto {
  @IsMongoId()
  produit!: string;

  @IsNumber()
  @Min(0.001)
  quantite!: number;
}

export class CreateTransferDto {
  @IsMongoId()
  commercial!: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TransferLineDto)
  lignes!: TransferLineDto[];
}

export class CancelTransferDto {
  @IsOptional()
  @IsString()
  motif?: string;
}