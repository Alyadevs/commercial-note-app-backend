import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';

export class ProductDto {
  @IsString()
  @IsNotEmpty()
  nom?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsMongoId()
  categorie: string;

  @IsOptional()
  @IsMongoId()
  sousCategorie: string;

  @IsNumber()
  @Min(0)
  prixAchat?: number;

  @IsNumber()
  @Min(0)
  prixVente?: number;

  // Utilisé seulement à la création ; ensuite, le stock change via un mouvement
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  seuilAlerte?: number;
  @IsOptional()
@IsString()
@MaxLength(400000)
@Matches(/^data:image\/(jpeg|png|webp);base64,/, { message: "Format d'image invalide" })
image?: string | null;
}

export class AdjustStockDto {
  // Positif = entrée, négatif = sortie
  @IsNumber()
  quantite?: number;

  @IsOptional()
  @IsString()
  note?: string;
}