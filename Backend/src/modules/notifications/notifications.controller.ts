import { Controller, Get, Patch, Delete, Param, Req, UseGuards, Body, Post } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RegisterDeviceDto } from '../notifications/dto/register-device.dto.js';


@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}


  
  @Get()
  getMyNotifications(@Req() req: any) {
    return this.notificationsService.getMyNotifications(
      req.user.sub,
    );
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.notificationsService.markAsRead(
      id,
      req.user.sub,
    );
  }

  @Delete(':id')
  deleteNotification(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.notificationsService.deleteNotification(
      id,
      req.user.sub,
    );
  }

  @Post('register-device')
  registerDevice(
    @Body() dto: RegisterDeviceDto,
    @Req() req: any,
  ) {
    return this.notificationsService.registerDevice(
      req.user.sub,
      dto.token,
    );
  }

  @Post('test-push')
  testPush(@Req() req: any) {
    return this.notificationsService.sendTestPush(
      req.user.sub,
    );
  }

  
}