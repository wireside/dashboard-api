import { User } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { BaseController } from '../common/base.controller.js';
import { ValidateMiddleware } from '../common/validate.middleware';
import { HTTPError } from '../errors/http-error.class.js';
import { ILogger } from '../logger/logger.interface.js';
import { TYPES } from '../types.js';
import { IAuthService } from '../auth/auth.service.interface';
import { UserLoginDto } from './dto/user-login.dto';
import { UserSignupDto } from './dto/user-signup.dto';
import { IUserController } from './users.controller.inteface.js';
import { IUserService } from './users.service.interface';

@injectable()
export class UserController extends BaseController implements IUserController {
	constructor(
		@inject(TYPES.ILogger) private loggerService: ILogger,
		@inject(TYPES.UserService) private userService: IUserService,
		@inject(TYPES.AuthService) private authService: IAuthService,
	) {
		super(loggerService);
		this.bindRoutes([
			{
				path: '/login',
				func: this.login,
				method: 'post',
				middlewares: [new ValidateMiddleware(UserLoginDto)],
			},
			{
				path: '/signup',
				func: this.signup,
				method: 'post',
				middlewares: [new ValidateMiddleware(UserSignupDto)],
			},
			{
				path: '/info',
				func: this.info,
				method: 'get',
				middlewares: [],
			}
		]);
	}

	public async login(
		{ body }: Request<{}, {}, UserLoginDto>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		const result = await this.userService.validateUser(body);
		if (!result) {
			return next(new HTTPError(401, 'Not authorized', 'users/login'));
		}
		const jwt: string = await this.authService.signJWT(body.email);
		this.ok(res, { jwt });
	}

	public async signup(
		{ body }: Request<{}, {}, UserSignupDto>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		const result = await this.userService.createUser(body);
		if (!result) {
			return next(new HTTPError(422, 'User is already exists', 'users/signup'));
		}
		this.ok<Omit<User, 'password'>>(res, {
			id: result.id,
			email: result.email,
			name: result.name,
		});
	}
	
	public async info(
		{ user }: Request<{}, {}, UserSignupDto>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		this.ok(res, user)
	}
}
