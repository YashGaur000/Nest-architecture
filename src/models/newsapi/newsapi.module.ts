import { Module } from '@nestjs/common';
import { NewsapiService } from './newsapi.service';
import { NewsapiController } from './newsapi.controller';

@Module({
  controllers: [NewsapiController],
  providers: [NewsapiService],
})
export class NewsapiModule {}
