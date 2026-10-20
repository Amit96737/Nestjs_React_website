import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service.js';
import { NotificationType } from '../../generated/prisma/client.js';
import {FirebaseAdminService} from '../../notifications/firebase-admin.service.js'



@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService,
    private readonly firebaseAdminService: FirebaseAdminService,
  ) {}

  async sendTestPush(userId: string) {
  const devices = await this.prisma.deviceToken.findMany({
    where: { user_id: userId },
    select: { token: true },
  });

  if (devices.length === 0) {
    throw new NotFoundException(
      'No registered devices found for this user',
    );
  }

  const results = await Promise.allSettled(
    devices.map((device) =>
      this.firebaseAdminService.sendPushNotification(
        device.token,
        'Test Notification',
        'Your browser push notifications are working!',
        { type: 'TEST' },
      ),
    ),
  );

  const errors = results
  .filter(
    (result): result is PromiseRejectedResult =>
      result.status === 'rejected',
  )
  .map((result) => {
    const error = result.reason;

    return {
      code: error?.code ?? 'UNKNOWN',
      message: error?.message ?? String(error),
    };
  });

  console.error('FCM PUSH ERRORS:', errors);

  return {
    message: 'Push notification test completed',
    totalDevices: devices.length,
    successful: results.filter(
      (result) => result.status === 'fulfilled',
    ).length,
    failed: results.filter(
      (result) => result.status === 'rejected',
    ).length,
    errors,
  };
  }


  async createNotification(data: {
    user_id: string;
    task_id?: string | null;
    type: NotificationType;
    title: string;
    message: string;
  }) {
    return this.prisma.notification.create({
      data: {
        user_id: data.user_id,
        task_id: data.task_id ?? null,
        type: data.type,
        title: data.title,
        message: data.message,
      },
    });
  }



  async getMyNotifications(userId: string) {
    const [notifications, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.notification.count({
        where: {
          user_id: userId,
          is_read: false,
        },
      }),
    ]);

    return {
      notifications,
      unreadCount,
    };
  }

  

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        user_id: userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    if (notification.is_read) {
      return notification;
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });
  }



  async deleteNotification(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        user_id: userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    return { message: 'Notification deleted successfully.' };
  }



  async registerDevice(userId: string, token: string) {
  return this.prisma.deviceToken.upsert({
    where: {
      token,
    },
    update: {
      user_id: userId,
    },
    create: {
      user_id: userId,
      token,
    },
    select: {
      id: true,
      user_id: true,
      created_at: true,
      updated_at: true,
    },
  });
}



async createAndSendNotification(
  userId: string,
  taskId: string,
  title: string,
  message: string,
  type: 'TASK_ASSIGNED' | 'TASK_DEADLINE' | 'TASK_STATUS_UPDATED',
) {
  const notification = await this.prisma.notification.create({
    data: {
      user_id: userId,
      task_id: taskId,
      title,
      message,
      type,
    },
  });

  const devices = await this.prisma.deviceToken.findMany({
    where: { user_id: userId },
    select: { token: true },
  });

  const results = await Promise.allSettled(
    devices.map((device) =>
      this.firebaseAdminService.sendPushNotification(
        device.token,
        title,
        message,
        {
          type,
          taskId,
          notificationId: notification.id,
        },
      ),
    ),
  );

  return {
    notification,
    pushSuccessful: results.filter(
      (result) => result.status === 'fulfilled',
    ).length,
    pushFailed: results.filter(
      (result) => result.status === 'rejected',
    ).length,
  };
}
  
}