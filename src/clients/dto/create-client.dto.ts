import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateClientDto {
  @IsNotEmpty() @IsString()
  nom: string;

  @IsOptional() @IsString()
  telephone?: string;

  @IsOptional() @IsString()
  adresse?: string;

  @IsOptional() @IsString()
  notes?: string;

  // Optionnel : un admin peut créer un client pour un commercial précis
  @IsOptional() @IsString()
  commercialId?: string;
}
