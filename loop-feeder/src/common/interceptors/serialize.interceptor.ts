import {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { map, Observable } from 'rxjs';

interface ClassContractor {
  new (...args: any[]): {};
}

export function Serialize(dto: ClassContractor) {
  return UseInterceptors(new SerializeInterceptor(dto));
}

export class SerializeInterceptor implements NestInterceptor {
  constructor(private dto: any) {}

  intercept(context: ExecutionContext, handler: CallHandler): Observable<any> {
    return handler.handle().pipe(
      map((data: any) => {
        const { data: resData, count, message } = data;
        return {
          status: context.switchToHttp().getResponse().statusCode,
          success: true,
          message: message || 'OK',
          count: count,
          data: plainToInstance(this.dto, resData, {
            excludeExtraneousValues: true,
          }),
        };
      }),
    );
  }
}
