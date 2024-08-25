import { Body, Controller, Post, Req } from '@nestjs/common';
import { ResponseDto } from 'src/common/common-dto';
import { UserLoginDto } from '../dtos/user.dto';
import { AuthService } from '../services/auth.service';

@Controller('public/auth')
export class PublicController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Req() req, @Body() body: UserLoginDto): Promise<ResponseDto> {
    let { data, message } = await this.authService.login(req, body);

    return {
      code: 200,
      success: true,
      message,
      data,
    };
  }
}
