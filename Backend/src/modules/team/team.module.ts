
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TeamController } from '../team/team.controller.js';
import { TeamService } from '../team/team.service.js';

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
controllers: [TeamController],
providers: [TeamService],
exports: [TeamService],
})
export class TeamModule {}
