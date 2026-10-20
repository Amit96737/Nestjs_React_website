
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
  UnauthorizedException
} from '@nestjs/common';
import { Request } from 'express';
import { TeamService } from '../team/team.service.js';
import { AddMemberDto } from '../team/dto/add-member.dto.js';
import { UpdateMemberRoleDto } from '../team/dto/update-member-role.dto.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';


type AuthenticatedRequest = Request & {
  user: {
    id?: string;
    sub?: string;
  };
};


@Controller('projects/:projectId/members')
@UseGuards(AuthGuard)
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  private getUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.id ?? req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException('Authenticated user ID is missing');
    }

    return userId;
  }


  @Post()
  addMember(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: AddMemberDto,
  ) {
    return this.teamService.addMember(
      projectId,
      this.getUserId(req),
      dto,
    );
  }


  @Get()
  findMembers(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.teamService.findMembers(
      projectId,
      this.getUserId(req),
    );
  }


  @Patch(':userId')
  updateRole(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.teamService.updateRole(
      projectId,
      userId,
      this.getUserId(req),
      dto,
    );
  }


  @Delete(':userId')
  removeMember(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.teamService.removeMember(
      projectId,
      userId,
      this.getUserId(req),
    );
  }

}
