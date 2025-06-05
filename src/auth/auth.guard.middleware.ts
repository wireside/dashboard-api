import { NextFunction, Request, Response } from 'express';
import { IMiddleware } from '../common/middleware.interface';
import { HTTPError } from '../errors/http-error.class';

export class AuthGuardMiddleware implements IMiddleware {
	constructor(private context?: string) {}

	execute(req: Request, res: Response, next: NextFunction): void {
		if (req.user) {
			return next();
		}
		next(new HTTPError(401, 'Not authorized', this.context));
	}
}
