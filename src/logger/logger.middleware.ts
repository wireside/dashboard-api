import { NextFunction, Request, Response } from 'express';
import { IMiddleware } from '../common/middleware.interface';
import { ILogger } from './logger.interface';

export class LogMiddleware implements IMiddleware {
	constructor(private logger: ILogger) {}

	execute(req: Request, res: Response, next: NextFunction): void {
		this.logger.log(`${req.method} ${req.path}`);
		next();
	}
}
