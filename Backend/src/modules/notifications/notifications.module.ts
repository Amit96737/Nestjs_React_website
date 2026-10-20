import { Module } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service.js';
import { NotificationsController } from '../notifications/notifications.controller.js';
import { FirebaseAdminService } from '../../notifications/firebase-admin.service.js';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [
            JwtModule.registerAsync({
            useFactory: () => ({
                secret: process.env.JWT_SECRET,
                signOptions: {
                expiresIn: '1d',
                },
            }),
            }),
        ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    FirebaseAdminService,
  ],
  exports: [
    NotificationsService,
    FirebaseAdminService,
  ],
})
export class NotificationsModule {}