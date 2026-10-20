import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { RedisModule } from './integrations/redis/redis.module.js';
import { MailModule } from './integrations/mail/mail.module.js';
import { TasksModule } from './modules/tasks/tasks.module.js';
import { TeamModule } from './modules/team/team.module.js';
import { ProjectsModule } from './modules/projects/projects.module.js';
import { NotificationsModule } from './modules//notifications/notifications.module.js';

import { MiddlewareConsumer } from '@nestjs/common';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    RedisModule,
    MailModule,
    UsersModule,
    TasksModule,
    ProjectsModule,
    TeamModule,
    NotificationsModule
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLoggerMiddleware)
      .forRoutes('*');
  }}