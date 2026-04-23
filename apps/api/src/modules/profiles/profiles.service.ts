import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProfileDto, UpdateProfileDto } from './dto';

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateProfileDto) {
    return this.prisma.resumeProfile.create({
      data: {
        userId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        location: dto.location,
        website: dto.website,
        github: dto.github,
        linkedin: dto.linkedin,
        summary: dto.summary,
        selfEvaluation: dto.selfEvaluation,
        isDefault: dto.isDefault ?? false,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.resumeProfile.findMany({
      where: { userId },
      include: {
        educationRecords: { orderBy: { sortOrder: 'asc' } },
        workExperiences: { orderBy: { sortOrder: 'asc' } },
        projectExperiences: { orderBy: { sortOrder: 'asc' } },
        skillRecords: { orderBy: { sortOrder: 'asc' } },
        certificateRecords: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async findOne(userId: string, id: string) {
    const profile = await this.prisma.resumeProfile.findFirst({
      where: { id, userId },
      include: {
        educationRecords: { orderBy: { sortOrder: 'asc' } },
        workExperiences: { orderBy: { sortOrder: 'asc' } },
        projectExperiences: { orderBy: { sortOrder: 'asc' } },
        skillRecords: { orderBy: { sortOrder: 'asc' } },
        certificateRecords: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async update(userId: string, id: string, dto: UpdateProfileDto) {
    await this.findOne(userId, id);

    return this.prisma.resumeProfile.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        location: dto.location,
        website: dto.website,
        github: dto.github,
        linkedin: dto.linkedin,
        summary: dto.summary,
        selfEvaluation: dto.selfEvaluation,
        isDefault: dto.isDefault,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prisma.resumeProfile.delete({
      where: { id },
    });
  }

  async setDefault(userId: string, id: string) {
    await this.findOne(userId, id);

    await this.prisma.resumeProfile.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    return this.prisma.resumeProfile.update({
      where: { id },
      data: { isDefault: true },
    });
  }
}
