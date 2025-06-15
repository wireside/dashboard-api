import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { IApiErrorResponse } from '../common/api-response.interface';
import { ILogger } from '../logger/logger.interface';
import { TYPES } from '../types';
import { IExceptionFilter } from './exception.filter.interface';
import { HTTPError } from './http-error.class';

@injectable()
export class ExceptionFilter implements IExceptionFilter {
	constructor(@inject(TYPES.ILogger) private logger: ILogger) {}

	catch(
		err: Error | HTTPError,
		req: Request,
		res: Response<IApiErrorResponse>,
		next: NextFunction,
	): void {
		if (err instanceof HTTPError) {
			this.logger.error(`[${err.context}] ${err.statusCode}: ${err.message}`);
			res.status(err.statusCode).send({
				success: false,
				error: {
					errors: [
						{
							message: err.message,
							context: err.context,
						},
					],
					stack: err.stack,
				},
			});
		} else {
			this.logger.error(`${err.message}`);
			res.status(500).send({
				success: false,
				error: {
					errors: [
						{
							message: err.message,
						},
					],
					stack: err.stack,
				},
			});
		}
	}
}
