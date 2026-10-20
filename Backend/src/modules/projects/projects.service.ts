
import {BadRequestException, Injectable, NotFoundException,} from '@nestjs/common';

import { PrismaService } from '../../database/prisma/prisma.service.js';
import { CreateProjectDto } from '../projects/dto/create-project.dto.js';
import { UpdateProjectDto } from '../projects/dto/update-project.dto.js';


@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateProjectDto) {
    this.validateDates(dto.start_date, dto.due_date);

    return this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        status: dto.status,
        start_date: dto.start_date
          ? new Date(dto.start_date)
          : undefined,
        due_date: dto.due_date
          ? new Date(dto.due_date)
          : undefined,
        user_id: userId,
      },
    });
  }


  async findAll(
    userId: string,
    page = 1,
    limit = 10,
    search?: string,
    status?: string,
  ) {
    if (
      !Number.isInteger(page) ||
      !Number.isInteger(limit) ||
      page < 1 ||
      limit < 1 ||
      limit > 100
    ) {
      throw new BadRequestException(
        'Page must be >= 1 and limit must be between 1 and 100',
      );
    }

    const allowedStatuses = [
      'PLANNING',
      'ACTIVE',
      'COMPLETED',
      'ON_HOLD',
    ];

    if (status && !allowedStatuses.includes(status)) {
      throw new BadRequestException('Invalid project status please enter PLANNING, ACTIVE, COMPLETED, ON_HOLD');
    }

    const where = {
      user_id: userId,
      ...(status ? { status: status as any } : {}),
      ...(search
        ? {
            name: {
              contains: search,
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          _count: { select: { tasks: true },
         },
         tasks: true,
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }


  async findOne(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        user_id: userId,
      },
      include: {
        _count: { select: { tasks: true } },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found with this id');
    }

    return project;
  }


  async update(
    userId: string,
    projectId: string,
    dto: UpdateProjectDto,
  ) {
    const existing = await this.prisma.project.findFirst({
      where: { id: projectId, user_id: userId },
    });

    if (!existing) {
      throw new NotFoundException('Project not found with this id');
    }

    const startDate =
      dto.start_date !== undefined
        ? dto.start_date
        : existing.start_date?.toISOString();

    const dueDate =
      dto.due_date !== undefined
        ? dto.due_date
        : existing.due_date?.toISOString();

    this.validateDates(startDate, dueDate);

    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && {
          description: dto.description,
        }),
        ...(dto.status !== undefined && { status: dto.status as any }),
        ...(dto.start_date !== undefined && {
          start_date: dto.start_date
            ? new Date(dto.start_date)
            : null,
        }),
        ...(dto.due_date !== undefined && {
          due_date: dto.due_date ? new Date(dto.due_date) : null,
        }),
      },
    });
  }

  
  async remove(userId: string, projectId: string) {
    const existing = await this.prisma.project.findFirst({
      where: { id: projectId, user_id: userId },
    });

    if (!existing) {
      throw new NotFoundException('Project not found');
    }

    await this.prisma.project.delete({
      where: { id: projectId },
    });

    return { message: 'Project deleted successfully' };
  }

  private validateDates(
    startDate?: string | null,
    dueDate?: string | null,
  ) {
    if (
      startDate &&
      dueDate &&
      new Date(dueDate).getTime() < new Date(startDate).getTime()
    ) {
      throw new BadRequestException(
        'Due date cannot be earlier than start date',
      );
    }
  }
}
