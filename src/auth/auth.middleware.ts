import { NextFunction, Request, Response } from 'express';
import { JsonWebTokenError, NotBeforeError, TokenExpiredError } from 'jsonwebtoken';
import { IMiddleware } from '../common/middleware.interface';
import { AuthError } from '../errors/auth-error.class';
import { HTTPError } from '../errors/http-error.class';
import { IAuthService } from './auth.service.interface';

export class AuthMiddleware implements IMiddleware {
	constructor(private authService: IAuthService) {}

	async execute(req: Request, res: Response, next: NextFunction): Promise<void> {
		if (req.headers.authorization) {
			const accessToken = req.headers.authorization.split(' ')[1];

			try {
				req.user = await this.authService.verifyAccessToken(accessToken);
				return next();
			} catch (e) {
				if (e instanceof TokenExpiredError) {
					return next(new AuthError(401, 'Access token is expired', 'auth', { expired: true }));
				} else if (e instanceof NotBeforeError) {
					return next(new AuthError(401, 'Access token is not valid yet', 'auth'));
				} else if (e instanceof JsonWebTokenError) {
					return next(new AuthError(401, 'Invalid access token', 'auth'));
				} else {
					return next(new HTTPError(500, 'Internal server error while verifying token', 'auth'));
				}
			}
		}

		return next();
	}
}
