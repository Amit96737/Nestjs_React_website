import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';

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
controllers: [TasksController],
providers: [TasksService, AuthGuard],
})
export class TasksModule {}