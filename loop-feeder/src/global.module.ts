import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthGuard } from './common/guards/auth.guard';
import { TokenService } from './common/services/token.service';

@Global()
@Module({
  imports: [HttpModule.register({}), CqrsModule],
  providers: [AuthGuard, TokenService],
  exports: [HttpModule, CqrsModule, TokenService],
})
export class GlobalModule {}
