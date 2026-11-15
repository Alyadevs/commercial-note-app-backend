import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from '../schema/category.schema';
import { Product } from '../schema/product.schema';
import { CategoryDto } from '../dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  findAll() {
    return this.categoryModel.find().sort({ nom: 1 }).lean();
  }

  async create(dto: CategoryDto) {
    if (dto.parent) {
      const parent = await this.categoryModel.findById(dto.parent);
      if (!parent) throw new NotFoundException('Catégorie parente introuvable');
      if (parent.parent) {
        throw new BadRequestException('Une sous-catégorie ne peut pas avoir de sous-catégorie');
      }
    }
    try {
      return await this.categoryModel.create({ nom: dto.nom?.trim(), parent: dto.parent || null });
    } catch (e: any) {
      if (e.code === 11000) throw new ConflictException('Cette catégorie existe déjà');
      throw e;
    }
  }

  async update(id: string, dto: CategoryDto) {
    try {
      const cat = await this.categoryModel.findByIdAndUpdate(id, { nom: dto.nom?.trim() }, { new: true });
      if (!cat) throw new NotFoundException('Catégorie introuvable');
      return cat;
    } catch (e: any) {
      if (e.code === 11000) throw new ConflictException('Ce nom existe déjà');
      throw e;
    }
  }

  async remove(id: string) {
    if (await this.categoryModel.exists({ parent: id })) {
      throw new BadRequestException("Supprimez d'abord les sous-catégories");
    }
    if (await this.productModel.exists({ $or: [{ categorie: id }, { sousCategorie: id }] })) {
      throw new BadRequestException('Cette catégorie est utilisée par des produits');
    }
    const res = await this.categoryModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Catégorie introuvable');
    return { deleted: true };
  }
}