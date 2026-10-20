import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  // const app = await NestFactory.create(AppModule, {
  //   logger: false,
  // });

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Nest Practice Project API')
    .setDescription('API documentation for NestJS practice')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  // const document = SwaggerModule.createDocument(app, config);
    const document = SwaggerModule.createDocument(app, config, {
  autoTagControllers: false,
});


  SwaggerModule.setup('api/docs', app, document);

  app.enableCors({
  origin: 'http://localhost:5173',
  });

  await app.listen(process.env.PORT ?? 3000);
  // await app.listen(process.env.PORT ?? 3000, '0.0.0.0');

}

bootstrap();