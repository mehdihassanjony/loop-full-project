import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RedisCacheModule } from '../redis/redis.module';
import { UserCacheService } from '../redis/user.cache.service';
import { AuthController } from './controllers/auth.controller';
import { PublicController } from './controllers/public.controller';
import { SecretController } from './controllers/secret.controller';
import { AuthService } from './services/auth.service';

@Module({
  imports: [RedisCacheModule],
  providers: [AuthService, UserCacheService],
  controllers: [PublicController, SecretController, AuthController],
  exports: [AuthService],
})
export class AuthModule {}
