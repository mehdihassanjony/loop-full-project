import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class UserCacheService {
  protected userActivityKey: string = 'auth:user_activity:';
  protected userActivityExpiry: number = 300;
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async setUserActivity(userId: string): Promise<boolean> {
    await this.cache.set(this.userActivityKey + userId, userId, {
      ttl: this.userActivityExpiry,
    });
    return true;
  }

  async getUserActivity(userId: string) {
    return await this.cache.get(this.userActivityKey + userId);
  }

  async delUserActivity(userId: string) {
    return await this.cache.del(this.setUserActivity + userId);
  }
}
