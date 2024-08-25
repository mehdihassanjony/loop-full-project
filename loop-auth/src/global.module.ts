import { HttpModule } from '@nestjs/axios';
import { CacheModule, Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import * as redisStore from 'cache-manager-redis-store';
import config from './config';

@Global()
@Module({
  imports: [
    HttpModule.register({}),
    CqrsModule,
    CacheModule.register({
      store: redisStore,
      ...config.redis,
    }),
  ],
  exports: [HttpModule, CqrsModule, CacheModule],
})
export class GlobalModule {}
