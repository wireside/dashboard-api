import { NextFunction, Request, Response } from 'express';
import { IMiddleware } from '../common/middleware.interface';
import { AuthError } from '../errors/auth-error.class';
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

		return next(new AuthError(401, 'Not authorized', this.context ?? 'auth'));
	}
}
