import { Controller, Get, UseGuards } from '@nestjs/common';
import { ResponseDto, UserTokenPayloadDto } from 'src/common/common-dto';
import { ModuleName, USERROLE } from 'src/common/constants';
import { ReqUser } from 'src/common/decorators/param.decorator';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { AuthorizeGuard } from 'src/common/guards/authorize.guard';
import { SecretGuard } from 'src/common/guards/secret.guard';
import { AuthService } from '../services/auth.service';

@UseGuards(SecretGuard, AuthorizeGuard)
@Controller('secret/auth')
export class SecretController {
  constructor(private readonly authService: AuthService) {}

  // @Get('/validate-token')
  // @Permissions(ModuleName.AUTH, USERROLE)
  // async validateToken(
  //   @ReqUser() reqUser: UserTokenPayloadDto,
  // ): Promise<ResponseDto> {
  //   let data = await this.authService.me(reqUser.userId);

  //   return {
  //     code: 200,
  //     success: true,
  //     message: 'Successfully validated token',
  //     data,
  //   };
  // }
}
