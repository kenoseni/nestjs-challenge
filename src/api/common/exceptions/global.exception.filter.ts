import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { HttpAdapterHost } from '@nestjs/core';
import { MongooseError } from 'mongoose';
import { MongoError } from 'mongodb';
@Catch()
export class HttpExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: any, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (httpStatus === null || httpStatus >= 500) {
      console.log(exception);
    }

    const responseBody = {
      responseCode: 0,
      responseText: exception?.response?.message ?? exception?.message,
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
      errorData: exception?.response?.errorData ?? null,
    };

    console.log('---------Http Exception filter------------', responseBody);
    console.log('---------Http Exception------------', exception);

    response.status(httpStatus ?? 500).json({
      ...responseBody,
    });
  }
}

@Catch(MongooseError, MongoError)
export class DbExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: MongooseError | MongoError, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;

    if (httpStatus >= 500) {
      console.log(exception);
    }

    let responseText = 'A database error occurred';
    if (exception instanceof MongooseError) {
      if (exception.name === 'ValidationError') {
        responseText = 'Validation failed';
      } else if (exception.name === 'CastError') {
        responseText = 'Invalid data type';
      }
    }

    const responseBody = {
      responseCode: 0,
      responseText: responseText,
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
    };

    console.log('[=======Database Exception=======]', exception);
    console.log('[=======Response body=======]', responseBody);

    response.status(HttpStatus.BAD_REQUEST).json({
      ...responseBody,
    });
  }
}
