import { Request, Response, NextFunction } from 'express';
import { inject, injectable } from 'inversify';
import { ILogger } from '../logger/logger.interface.js';
import { LoggerService } from '../logger/logger.service.js';
import { TYPES } from '../types.js';
import { IExceptionFilter } from './exception.filter.interface.js';
import { HTTPError } from './http-error.class.js';

@injectable()
export class ExceptionFilter implements IExceptionFilter {
	constructor(
		@inject(TYPES.ILogger) private logger: ILogger,
	) { }
	
	catch(err: Error | HTTPError, req: Request, res: Response, next: NextFunction) {
		if (err instanceof HTTPError) {
			this.logger.error(`[${err.context}] ${err.statusCode}: ${err.message}`);
			res.status(err.statusCode).send({
				err: err.message,
			});
		} else {
			this.logger.error(`${err.message}`);
			res.status(500).send({
				err: err.message,
			});
		}
	}
}