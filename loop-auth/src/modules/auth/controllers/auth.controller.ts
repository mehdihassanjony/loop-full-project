import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ResponseDto } from 'src/common/common-dto';
import { TokenGuard } from '../../../common/guards/token.guard';
import { AuthService } from '../services/auth.service';

@UseGuards(TokenGuard)
@Controller('/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('/validate-token')
  async validateUserToken(@Req() req): Promise<ResponseDto> {
    let data = await this.authService.validateUserToken(req);
    return {
      code: 200,
      success: true,
      message: 'Token validated successfully.',
      data,
    };
  }
}
