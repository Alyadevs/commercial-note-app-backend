import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from '../schema/category.schema';
import { Product } from '../schema/product.schema';
import { StockMovement } from '../schema/stock-movement.schema';
import { AdjustStockDto, ProductDto } from '../dto/product.dto';
import {  Types } from 'mongoose';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(StockMovement.name) private movementModel: Model<StockMovement>,
  ) {}

  findAll() {
    return this.productModel
      .find()
      .populate('categorie', 'nom')
      .populate('sousCategorie', 'nom')
      .sort({ nom: 1 })
      .lean();
  }

  // La catégorie doit être principale, et la sous-catégorie doit lui appartenir
  private async checkCategories(categorie: string, sousCategorie?: string) {
    const cat = await this.categoryModel.findById(categorie);
    if (!cat || cat.parent) throw new BadRequestException('Catégorie invalide');
    if (sousCategorie) {
      const sub = await this.categoryModel.findById(sousCategorie);
      if (!sub || sub.parent?.toString() !== categorie) {
        throw new BadRequestException('Sous-catégorie invalide pour cette catégorie');
      }
    }
  }

  async create(dto: ProductDto) {
    await this.checkCategories(dto.categorie, dto.sousCategorie);
    const { stock = 0, ...data } = dto;
    const product = await this.productModel.create({
      ...data,
      nom: data.nom?.trim(),
      sousCategorie: data.sousCategorie || null,
      stock,
    });
    if (stock > 0) {
      await this.movementModel.create({
        produit: product._id,
        type: 'entree',
        quantite: stock,
        stockApres: stock,
        note: 'Stock initial',
      });
    }
    return product;
  }

  async update(id: string, dto: ProductDto) {
    await this.checkCategories(dto.categorie , dto.sousCategorie);
    const { stock, ...data } = dto; // le stock ne se modifie que par un mouvement
    const product = await this.productModel.findByIdAndUpdate(
      id,
      { ...data, nom: data.nom?.trim(), sousCategorie: data.sousCategorie || null },
      { new: true },
    );
    if (!product) throw new NotFoundException('Produit introuvable');
    return product;
  }

  async remove(id: string) {
    const product = await this.productModel.findByIdAndDelete(id);
    if (!product) throw new NotFoundException('Produit introuvable');
    await this.movementModel.deleteMany({ produit: product._id });
    return { deleted: true };
  }

  async adjustStock(id: string, dto: AdjustStockDto) {
    if (!dto.quantite) throw new BadRequestException('La quantité ne peut pas être 0');

    // Mise à jour atomique : refuse si le stock deviendrait négatif
    const product = await this.productModel.findOneAndUpdate(
      { _id: id, stock: { $gte: -dto.quantite } },
      { $inc: { stock: dto.quantite } },
      { new: true },
    );
    if (!product) {
      const exists = await this.productModel.exists({ _id: id });
      throw exists
        ? new BadRequestException('Stock insuffisant pour cette sortie')
        : new NotFoundException('Produit introuvable');
    }

    await this.movementModel.create({
      produit: product._id,
      type: dto.quantite > 0 ? 'entree' : 'sortie',
      quantite: dto.quantite,
      stockApres: product.stock,
      note: dto.note || 'Ajustement manuel',
    });
    return product;
  }

async movements(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new BadRequestException('ID produit invalide');
  }

  const movements = await this.movementModel
    .find({
      produit: new Types.ObjectId(id),
    })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  console.log('Mouvements récupérés :', movements.length);

  return movements;
}
}