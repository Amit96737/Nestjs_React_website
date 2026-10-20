
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service.js';
import { AddMemberDto } from '../../../src/modules/team/dto/add-member.dto.js';
import { UpdateMemberRoleDto } from '../../../src/modules/team/dto/update-member-role.dto.js';


@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService) {}

  private async getProject(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found with this id');
    }

    return project;
  }


  private async requireManager(
    projectId: string,
    requesterId: string,
  ) {
    const project = await this.getProject(projectId);

    if (project.user_id === requesterId) {
      return { project, role: 'OWNER' as const };
    }

    const membership = await this.prisma.projectMember.findUnique({
      where: {
        project_id_user_id: {
          project_id: projectId,
          user_id: requesterId,
        },
      },
    });

    if (
      !membership ||
      !['OWNER', 'ADMIN'].includes(membership.role)
    ) {
      throw new ForbiddenException(
        'Only project owners or admins can manage members',
      );
    }

    return { project, role: membership.role };
  }


  async addMember(
    projectId: string,
    requesterId: string,
    dto: AddMemberDto,
  ) {
    await this.requireManager(projectId, requesterId);

    const { role: managerRole } = await this.requireManager(projectId, requesterId,);

    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        is_active: true,
      },
    });

    if (!user || !user.is_active) {
      throw new NotFoundException(
        'User with this email address not found',
      );
    }

    if (user.id === requesterId) {
      throw new BadRequestException(
        'You are already the project owner or manager',
      );
    }

    if (managerRole === 'ADMIN' && dto.role === 'ADMIN') {
      throw new ForbiddenException(
        'Only the project owner can assign the ADMIN role',
      );
    }

    const existing = await this.prisma.projectMember.findUnique({
      where: {
        project_id_user_id: {
          project_id: projectId,
          user_id: user.id,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        'This user is already a project member',
      );
    }

    return this.prisma.projectMember.create({
      data: {
        project_id: projectId,
        user_id: user.id,
        role: (dto.role ?? 'MEMBER') as any,
      },
      select: {
        project_id: true,
        user_id: true,
        role: true,
        joined_at: true,
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });
  }


  async findMembers(projectId: string, requesterId: string) {
    await this.getProject(projectId);

    const isMember = await this.prisma.projectMember.findUnique({
      where: {
        project_id_user_id: {
          project_id: projectId,
          user_id: requesterId,
        },
      },
    });

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { user_id: true },
    });

    if (!isMember && project?.user_id !== requesterId) {
      throw new ForbiddenException(
        'You do not have access to this project',
      );
    }

    const members = await this.prisma.projectMember.findMany({
      where: { project_id: projectId },
      orderBy: { joined_at: 'asc' },
      select: {
        project_id: true,
        user_id: true,
        role: true,
        joined_at: true,
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    const ownerId = project!.user_id;
    const ownerIncluded = members.some((m) => m.user_id === ownerId);

    if (!ownerIncluded) {
      const owner = await this.prisma.user.findUnique({
        where: { id: ownerId },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      });

      if (owner) {
        members.unshift({
          project_id: projectId,
          user_id: owner.id,
          role: 'OWNER' as any,
          joined_at: new Date(),
          user: {
            first_name: owner.first_name,
            last_name: owner.last_name,
            email: owner.email,
          },
        });
      }
    }

    return members;
  }


  async updateRole(
    projectId: string,
    userId: string,
    requesterId: string,
    dto: UpdateMemberRoleDto,
  ) {
    const { project, role: managerRole } =
      await this.requireManager(projectId, requesterId);
      

    if (userId === project.user_id) {
      throw new BadRequestException(
        'The project owner role cannot be changed here',
      );
    }

    const member = await this.prisma.projectMember.findUnique({
      where: {
        project_id_user_id: {
          project_id: projectId,
          user_id: userId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Project member not found');
    }

    if (managerRole === 'ADMIN' && member.role !== 'MEMBER') {
      throw new ForbiddenException(
        'Admins can only change roles of members',
      );
    }

    if (managerRole === 'ADMIN' && dto.role === 'ADMIN') {
      throw new ForbiddenException(
        'Only the project owner can promote members to ADMIN',
      );
    }

    return this.prisma.projectMember.update({
      where: {
        project_id_user_id: {
          project_id: projectId,
          user_id: userId,
        },
      },
      data: { role: dto.role as any },
      select: {
        project_id: true,
        user_id: true,
        role: true,
        joined_at: true,
      },
    });
  }
  

  async removeMember(
    projectId: string,
    userId: string,
    requesterId: string,
  ) {
    const { project, role: managerRole } =
      await this.requireManager(projectId, requesterId);

    if (userId === project.user_id) {
      throw new BadRequestException(
        'The project owner cannot be removed',
      );
    }

    const member = await this.prisma.projectMember.findUnique({
      where: {
        project_id_user_id: {
          project_id: projectId,
          user_id: userId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Project member not found');
    }

    if (managerRole === 'ADMIN' && member.role !== 'MEMBER') {
      throw new ForbiddenException(
        'Admins can only remove regular members',
      );
    }

    await this.prisma.projectMember.delete({
      where: {
        project_id_user_id: {
          project_id: projectId,
          user_id: userId,
        },
      },
    });

    return { message: 'Project member removed successfully' };
  }
}
