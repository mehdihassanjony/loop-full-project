import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    if (context.getType() === 'http') {
      const ctx = context.switchToHttp(),
        request = ctx.getRequest<Request>(),
        response = ctx.getRequest<Response>();
      return next.handle().pipe(
        tap((data) => {
          const reqDetails = {
            method: request.method,
            queryParams: request.query,
            body: request.body,
            requestedEndpoint: request.originalUrl,
            responseBody: data,
            status: response.statusCode,
          };
          const logString =
            JSON.stringify(reqDetails) +
            '\n' +
            [request.method, request.originalUrl, response.statusCode].join(
              ' ',
            );
          Logger.log(logString, 'RequestLoggingInterceptor');
        }),
      );
    }
  }
}
