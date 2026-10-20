import {Body, Controller, Post, UseGuards, Get, Query, Req, Param, ParseUUIDPipe, Patch, UnauthorizedException, Delete} from '@nestjs/common';
import { TasksService } from './tasks.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { QueryTaskDto } from '../../modules/tasks/dto/query-task.dto.js';
import { UpdateTaskDto } from '../../modules/tasks/dto/update-task.dto.js';
import { AssignTaskDto } from '../../modules/tasks/dto/assign-task.dto.js';


@Controller('tasks')
@UseGuards(AuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(
    @CurrentUser() user: { id?: string; sub?: string },
    @Body() dto: CreateTaskDto,
  ) {
    const userId = user.id ?? user.sub;

    if (!userId) {
      throw new Error('Authenticated user ID is missing');
    }

    return this.tasksService.create(userId, dto);
  }


  @Get()
  findAll(
    @Req() req: any,
    @Query() query: QueryTaskDto,
  ) {
    const userId = req.user?.id ?? req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException('Authenticated user ID is missing');
    }

    return this.tasksService.findAll(userId, query);
  }

  
  @Get('stats')
  getStats(@Req() req: any) {
    const userId = req.user?.id ?? req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException(
        'Authenticated user ID is missing',
      );
    }

    return this.tasksService.getStats(userId);
  }


  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id ?? req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException(
        'Authenticated user ID is missing',
      );
    }

    return this.tasksService.findOne(userId, id);
  }


  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateTaskDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id ?? req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException(
        'Authenticated user ID is missing',
      );
    }

    return this.tasksService.update(userId, id, dto);
  }


  @Delete(':id')
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id ?? req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException(
        'Authenticated user ID is missing',
      );
    }

    return this.tasksService.remove(userId, id);
  }


  @Patch(':id/assign')
  assignTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Body() dto: AssignTaskDto,
  ) {
    const requesterId = req.user?.id ?? req.user?.sub;

    if (!requesterId) {
      throw new UnauthorizedException('Authenticated user ID is missing');
    }

    return this.tasksService.assignTask(id, requesterId, dto);
  }

  
  @Patch(':id/unassign')
  unassignTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    const requesterId = req.user?.id ?? req.user?.sub;

    if (!requesterId) {
      throw new UnauthorizedException('Authenticated user ID is missing');
    }

    return this.tasksService.unassignTask(id, requesterId);
  }

}