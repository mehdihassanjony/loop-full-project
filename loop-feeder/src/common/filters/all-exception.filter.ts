import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Environment } from '../enums';
import { Error } from 'mongoose';
const ValidationError = Error.ValidationError;

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp(),
      response = ctx.getResponse<any>(),
      request = ctx.getRequest<Request>();

    let message: string = '',
      status: number = 400;

    if (exception instanceof ValidationError) {
      message = Object.values(exception['errors'])[0]['message'];
    } else if (exception instanceof HttpException) {
      message = exception.message;
      status = exception.getStatus();
    } else {
      message = exception.message;
      status = 500;
    }
    const data = {
      status: status,
      success: false,
      message: message,
      data: null,
    };
    const extra = {
      method: request.method,
      queryParams: request['query'],
      body: request.body,
      endpoint: request['originalUrl'],
      responseBody: data,
      headers: request.headers,
    };
    // if (process.env.NODE_ENV === Environment.PRODUCTION)
    //   Sentry.captureException(exception, { extra });
    response.status(status).send(data);
  }
}
