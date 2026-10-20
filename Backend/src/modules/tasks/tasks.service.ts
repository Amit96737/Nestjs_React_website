import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { QueryTaskDto } from '../../modules/tasks/dto/query-task.dto.js';
import { UpdateTaskDto } from '../../modules/tasks/dto/update-task.dto.js';
import { AssignTaskDto } from '../../modules/tasks/dto/assign-task.dto.js';


@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  
  async create(userId: string, dto: CreateTaskDto) {
    if (dto.project_id) {
      const project = await this.prisma.project.findUnique({
        where: { id: dto.project_id },
        select: { id: true, user_id: true },
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      const isOwner = project.user_id === userId;

      const membership = await this.prisma.projectMember.findUnique({
        where: {
          project_id_user_id: {
            project_id: dto.project_id,
            user_id: userId,
          },
        },
      });

      if (!isOwner && !membership) {
        throw new ForbiddenException(
          'You do not have access to this project',
        );
      }
    }

    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority ?? 'MEDIUM',
        due_date: dto.due_date
          ? new Date(dto.due_date)
          : undefined,
        user_id: userId,
        project_id: dto.project_id ?? null,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }



  async findAll(userId: string, query: QueryTaskDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = {
      user_id: userId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            title: {
              contains: query.search,
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          created_at: 'desc',
        },
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: tasks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }


  async findOne(userId: string, taskId: string) {
  const task = await this.prisma.task.findFirst({
    where: {
      id: taskId,
      user_id: userId,
    },
  });

  if (!task) {
    throw new NotFoundException('Task not found');
  }

  return task;
  }


  async update(
  userId: string,
  taskId: string,
  dto: UpdateTaskDto,
) {
  const result = await this.prisma.task.updateMany({
    where: {
      id: taskId,
      user_id: userId,
    },
    data: {
      title: dto.title,
      description: dto.description,
      status: dto.status,
      priority: dto.priority,
      due_date:
        dto.due_date === undefined
          ? undefined
          : dto.due_date === null
            ? null
            : new Date(dto.due_date),
    },
  });

  if (result.count === 0) {
    throw new NotFoundException('Task not found');
  }

  return this.prisma.task.findFirst({
    where: {
      id: taskId,
      user_id: userId,
    },
  });
  }


  async remove(userId: string, taskId: string) {
  const result = await this.prisma.task.deleteMany({
    where: {
      id: taskId,
      user_id: userId,
    },
  });

  if (result.count === 0) {
    throw new NotFoundException('Task not found');
  }

  return {
    message: 'Task deleted successfully',
  };
  }


  async getStats(userId: string) {
  const now = new Date();

  const [
    total,
    todo,
    inProgress,
    done,
    overdue,
  ] = await Promise.all([
    this.prisma.task.count({
      where: { user_id: userId },
    }),

    this.prisma.task.count({
      where: {
        user_id: userId,
        status: 'TODO',
      },
    }),

    this.prisma.task.count({
      where: {
        user_id: userId,
        status: 'IN_PROGRESS',
      },
    }),

    this.prisma.task.count({
      where: {
        user_id: userId,
        status: 'DONE',
      },
    }),

    this.prisma.task.count({
      where: {
        user_id: userId,
        status: { not: 'DONE' },
        due_date: { lt: now },
      },
    }),
  ]);

  return {
    total,
    todo,
    inProgress,
    done,
    overdue,
    completionRate:
      total === 0
        ? 0
        : Math.round((done / total) * 100),
  };
  }


  private async getTaskForAssignment(taskId: string, requesterId: string) {
  const task = await this.prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        select: {
          id: true,
          user_id: true,
        },
      },
    },
  });

  if (!task) {
    throw new NotFoundException('Task not found');
  }

  // Personal task: only its creator can manage assignment.
  if (!task.project_id) {
    if (task.user_id !== requesterId) {
      throw new ForbiddenException('You cannot manage this task');
    }
    throw new BadRequestException(
      'Personal tasks cannot be assigned to project members',
    );
  }

  const isProjectOwner = task.project?.user_id === requesterId;

  const membership = await this.prisma.projectMember.findUnique({
    where: {
      project_id_user_id: {
        project_id: task.project_id,
        user_id: requesterId,
      },
    },
  });

  const isProjectMember = Boolean(membership);
  const isTaskCreator = task.user_id === requesterId;

  if (!isProjectOwner && !isProjectMember && !isTaskCreator) {
    throw new ForbiddenException('You do not have access to this task');
  }

  return task;
}


  async assignTask(
    taskId: string,
    requesterId: string,
    dto: AssignTaskDto,
  ) {
    const task = await this.getTaskForAssignment(taskId, requesterId);

    const assigneeId = dto.assigned_to_id;

    // Project owner is also allowed as an assignee, even if
    // they do not yet have a ProjectMember row.
    const isProjectOwner = task.project?.user_id === assigneeId;

    const membership = await this.prisma.projectMember.findUnique({
      where: {
        project_id_user_id: {
          project_id: task.project_id!,
          user_id: assigneeId,
        },
      },
    });

    if (!isProjectOwner && !membership) {
      throw new BadRequestException(
        'Assignee must be a member of this project',
      );
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: { assigned_to_id: assigneeId },
      include: {
        assigned_to: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });
  }
  

  async unassignTask(taskId: string, requesterId: string) {
    await this.getTaskForAssignment(taskId, requesterId);

    return this.prisma.task.update({
      where: { id: taskId },
      data: { assigned_to_id: null },
      include: {
        assigned_to: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });
  }
  

}