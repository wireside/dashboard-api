import { Response, Request, NextFunction } from 'express';
import { BaseController } from '../common/base.controller.js';
import { HTTPError } from '../errors/http-error.class.js';
import { LoggerService } from '../logger/logger.service.js';

export class UserController extends BaseController {
	constructor(logger: LoggerService) {
		super(logger);
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
			}
		])
	}
	
	login(req: Request, res: Response, next: NextFunction): void {
		next(new HTTPError(401, 'Not authorized', 'users/login'));
	}
	
	signup(req: Request, res: Response, next: NextFunction): void {
		this.ok<string>(res, 'signup')
	}
}