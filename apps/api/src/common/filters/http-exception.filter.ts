import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const requestId = request.header('x-request-id') ?? randomUUID();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw = exception instanceof HttpException ? exception.getResponse() : 'Erreur interne du serveur';
    const message = typeof raw === 'object' && raw !== null && 'message' in raw ? raw.message : raw;

    if (status >= 500) this.logger.error({ requestId, path: request.url, exception });
    response.status(status).json({ statusCode: status, message, requestId, timestamp: new Date().toISOString() });
  }
}
