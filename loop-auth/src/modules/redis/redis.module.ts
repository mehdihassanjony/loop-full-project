import { CacheModule, Module } from '@nestjs/common';
import { RedisCacheService } from './redis.service';
import * as redisStore from 'cache-manager-redis-store';
import config from '../../config';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      ...config.redis,
    }),
  ],
  providers: [RedisCacheService],
  exports: [RedisCacheService],
})
export class RedisCacheModule {}
