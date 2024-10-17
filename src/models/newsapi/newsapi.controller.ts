import { Controller, Get, HttpCode, Query } from '@nestjs/common';
import { NewsapiService } from './newsapi.service';
import { News } from './news.interfaces';

@Controller('news')
export class NewsapiController {
  constructor(private readonly newsapiService: NewsapiService) {}

  @Get()
  @HttpCode(200)
  getNews(@Query('pageSize') pageSize: number): Promise<News[]> {
    return this.newsapiService.getNews(pageSize);
  }
}
