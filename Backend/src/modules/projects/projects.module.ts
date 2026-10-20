
import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller.js';
import { ProjectsService } from './projects.service.js';
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
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
