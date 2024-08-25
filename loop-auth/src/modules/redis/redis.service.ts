import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisCacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async set(key: string, value: string, ttl: number) {
    await this.cacheManager.set(key, value, { ttl });
    return true;
  }

  async get(key: string) {
    return await this.cacheManager.get(key);
  }

  async del(key: string) {
    return await this.cacheManager.del(key);
  }

  // only for testing
  async reset() {
    return await this.cacheManager.reset();
  }
}
