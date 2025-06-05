import { NextFunction, Request, Response } from 'express';
import { JwtPayload, verify } from 'jsonwebtoken';
import { IMiddleware } from '../common/middleware.interface';

export class AuthMiddleware implements IMiddleware {
	constructor(private secretKey: string) {}

	execute(req: Request, res: Response, next: NextFunction): void {
		if (req.headers.authorization) {
			verify(req.headers.authorization.split(' ')[1], this.secretKey, (error, payload) => {
				if (error) {
					next();
				} else if (payload as JwtPayload) {
					const { email } = payload as JwtPayload;
					req.user = {
						email,
					};
				}
			});
		}
		next();
	}
}
