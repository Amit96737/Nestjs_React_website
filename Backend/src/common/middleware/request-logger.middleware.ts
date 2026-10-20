import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const start = Date.now();

    res.on('finish', () => {
      const time = Date.now() - start;

      console.log(
        `${req.method} ${req.originalUrl} ${res.statusCode} - ${time}ms`,
      );
    });

    next();
  }
}