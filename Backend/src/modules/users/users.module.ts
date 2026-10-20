import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
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
  controllers: [UsersController],
  providers: [UsersService, AuthGuard],
})
export class UsersModule {}