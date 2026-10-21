import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../users/schemas/user.schema'; // adapte le chemin

@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  @Get()
  async get(@Req() req: any) {
    return this.userModel.findById(req.user.userId).select('-password').lean();
  }

  @Put()
  async update(
    @Req() req: any,
    @Body() body: { nom?: string; email?: string; telephone?: string },
  ) {
    // On n'autorise que ces trois champs (jamais role ni password)
    const { nom, email, telephone } = body;
    return this.userModel
      .findByIdAndUpdate(req.user.userId, { nom, email, telephone }, { new: true })
      .select('-password')
      .lean();
  }
}