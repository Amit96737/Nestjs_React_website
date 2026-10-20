import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
    });
  }

  async setOtp(email: string, otp: string) {
    const key = `otp:${email}`;

    await this.redis.set(key, otp, 'EX', 600);
  }

  async getOtp(email: string) {
    const key = `otp:${email}`;

    return this.redis.get(key);
  }

  async deleteOtp(email: string) {
    const key = `otp:${email}`;

    await this.redis.del(key);
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}