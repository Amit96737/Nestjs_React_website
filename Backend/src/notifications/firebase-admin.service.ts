import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private messaging!: Messaging;

  onModuleInit() {
    const app =
      getApps().length > 0
        ? getApps()[0]
        : initializeApp({
            credential: applicationDefault(),
          });

    this.messaging = getMessaging(app);
    this.logger.log('Firebase Admin initialized successfully.');
  }

  async sendPushNotification(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    return this.messaging.send({
      token,
      notification: {
        title,
        body,
      },
      ...(data ? { data } : {}),
    });
  }
}