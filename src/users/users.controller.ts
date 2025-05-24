import { Response, Request, NextFunction } from 'express';
import { inject, injectable } from 'inversify';
import { BaseController } from '../common/base.controller.js';
import { HTTPError } from '../errors/http-error.class.js';
import { ILogger } from '../logger/logger.interface.js';
import { TYPES } from '../types.js';
import { IUserController } from './users.controller.inteface.js';

@injectable()
export class UserController extends BaseController implements IUserController {
	constructor(@inject(TYPES.ILogger) private loggerService: ILogger) {
		super(loggerService);
		this.bindRoutes([
			{
				path: '/login',
				func: this.login,
				method: 'post',
			},
			{
				path: '/signup',
				func: this.signup,
				method: 'post',
			},
		]);
	}

	public login(req: Request, res: Response, next: NextFunction): void {
		next(new HTTPError(401, 'Not authorized', 'users/login'));
	}

	public signup(req: Request, res: Response, next: NextFunction): void {
		this.ok<string>(res, 'signup');
	}
}
