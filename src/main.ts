import './tracting';
// server.ts
import { NestFactory } from '@nestjs/core';
import * as bodyParser from 'body-parser';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LOGS_SOURCE_FILE, USE_SWAGGER } from './environments';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import { format, transports } from 'winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      level: 'info',
      format: format.combine(format.timestamp(), format.json()),
      transports: [
        new transports.File({
          filename: LOGS_SOURCE_FILE,
        }),
      ],
    }),
  });

  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  app.enableCors({
    credentials: true,
    origin: [
      'https://www.kash.io',
      'https://dev3782910.kash.io',
      'https://app.kash.io',
      'https://spirit.kash.io',
      'http://localhost:4200',
      'https://kash-frontend.pages.dev',
      'https://kash-kredits.vercel.app',
      'https://kash-solaris.vercel.app',
    ],
  });
  app.useGlobalPipes(new ValidationPipe());

  if (USE_SWAGGER) {
    const config = new DocumentBuilder()
      .setTitle('Kash API')
      .setDescription('Internal Kash API')
      .setVersion('1.1')
      .addTag('Solaris -> persons')
      .addTag('Solaris -> devices')
      .addTag('Solaris -> account')
      .addTag('Solaris -> cards')
      .addTag('prime-trust')
      .addTag('users')
      .addTag('wyre')
      .addTag('private-memo')
      .addTag('2fa')
      .addTag('baanx')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('swagger', app, document);
  }

  await app.listen(3000);
}
bootstrap();
