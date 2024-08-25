import { Controller, Get } from '@nestjs/common';
import { ResponseDto } from './common/common-dto';

@Controller()
export class AppController {
  @Get()
  getHello(): ResponseDto {
    return {
      code: 200,
      success: true,
      message: 'Hello from loop-auth service',
      data: null,
    };
  }
}
