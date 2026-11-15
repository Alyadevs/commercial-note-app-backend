import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CategoryDto {
  @IsString()
  @IsNotEmpty()
  nom?: string;

  @IsOptional()
  @IsMongoId()
  parent?: string;
}