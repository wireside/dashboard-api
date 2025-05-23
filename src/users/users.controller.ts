import { Response, Request, NextFunction } from 'express';
import { inject, injectable } from 'inversify';
import { BaseController } from '../common/base.controller.js';
import { HTTPError } from '../errors/http-error.class.js';
import { ILogger } from '../logger/logger.interface.js';
import { TYPES } from '../types.js';

@injectable()
export class UserController extends BaseController {
	constructor(
		@inject(TYPES.ILogger) private loggerService: ILogger,
	) {
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
	
	login(req: Request, res: Response, next: NextFunction): void {
		next(new HTTPError(401, 'Not authorized', 'users/login'));
	}
	
	signup(req: Request, res: Response, next: NextFunction): void {
		this.ok<string>(res, 'signup');
	}
}