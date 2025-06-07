import { NextFunction, Request, Response } from 'express';
import { injectable } from 'inversify';
import { IMiddleware } from '../common/middleware.interface';
import { HTTPError } from '../errors/http-error.class';
import { IAuthService } from './auth.service.interface';

export class AuthGuardMiddleware implements IMiddleware {
	constructor(
		private authService: IAuthService,
		private context?: string,
	) {}

	async execute(req: Request, res: Response, next: NextFunction): Promise<void> {
		if (req.user) {
			return next();
		}

		return next(new HTTPError(401, 'Not authorized', this.context ?? 'auth'));
	}
}
