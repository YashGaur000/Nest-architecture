import { Injectable, OnModuleInit } from '@nestjs/common';
import { News, NewsSource } from './news.interfaces';
import { NEWS_API } from '../../environments';

const NewsAPI = require('newsapi');

const keywords = [
  'neobank',
  'banking',
  'defi',
  'decentralized finance',
  'transferwise',
  'western union',
  'venmo',
  'coinbase',
  'savings',
  'yield farming',
  'bitcoin',
  'ethereum',
  'terra luna',
  'cryptocurrency',
  'intellabridge',
  'voyager digital',
  'celcius network',
];

@Injectable()
export class NewsapiService implements OnModuleInit {
  newsapi;

  onModuleInit(): void {
    this.initNewsapi();
  }

  getNews(pageSize = 20): Promise<News[]> {
    pageSize = pageSize > 50 ? 50 : pageSize;
    return this.newsapi.v2
      .everything({
        qInTitle: keywords.map((i) => `"${i}"`).join('OR'),
        pageSize,
        sortBy: 'publishedAt',
        language: 'en',
      })
      .then((response: NewsSource) => {
        if (response.status === 'ok') {
          const news: News[] = [];
          for (const item of response?.articles) {
            const isNewsExist = news.find((v) => v.title === item.title);
            if (isNewsExist) {
              continue;
            }
            news.push(item);
          }
          return news;
        }
      });
  }

  private initNewsapi(): void {
    this.newsapi = new NewsAPI(NEWS_API);
  }
}
