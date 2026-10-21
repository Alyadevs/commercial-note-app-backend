import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class VehiculeDto {
  @IsOptional() @IsString() marque?: string;
  @IsOptional() @IsString() modele?: string;
  @IsOptional() @IsString() immatriculation?: string;
}

export class CreateUserDto {
  @IsNotEmpty() @IsString()
  nom: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsIn(['admin', 'commercial'])
  role: 'admin' | 'commercial';

  @IsOptional() @IsString()
  telephone?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => VehiculeDto)
  vehicule?: VehiculeDto;
}
