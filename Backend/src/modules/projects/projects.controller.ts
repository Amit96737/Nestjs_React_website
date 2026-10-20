
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { CreateProjectDto } from '../projects/dto/create-project.dto.js';
import { UpdateProjectDto } from '../projects/dto/update-project.dto.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { ProjectsService } from './projects.service.js';

type AuthenticatedRequest = Request & {
  user: {
    id?: string;
    sub?: string;
  };
};

@Controller('projects')
@UseGuards(AuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateProjectDto,
  ) {
    const userId = req.user.id ?? req.user.sub;
    console.log("userId", userId)
    return this.projectsService.create(userId!, dto);
  }

  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const userId = req.user.id ?? req.user.sub;
    return this.projectsService.findAll(
      userId!,
      page,
      limit,
      search,
      status,
    );
  }

  @Get(':id')
  findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) projectId: string,
  ) {
    const userId = req.user.id ?? req.user.sub;
    return this.projectsService.findOne(userId!, projectId);
  }

  @Patch(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) projectId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    const userId = req.user.id ?? req.user.sub;
    return this.projectsService.update(userId!, projectId, dto);
  }

  @Delete(':id')
  remove(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) projectId: string,
  ) {
    const userId = req.user.id ?? req.user.sub;
    return this.projectsService.remove(userId!, projectId);
  }
}
