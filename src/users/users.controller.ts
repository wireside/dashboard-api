import { User } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { AuthGuardMiddleware } from '../auth/auth.guard.middleware';
import { IAuthService } from '../auth/auth.service.interface';
import { IApiResponse } from '../common/api-response.interface';
import { BaseController } from '../common/base.controller.js';
import { ValidateMiddleware } from '../common/validate.middleware';
import { IConfigService } from '../config/config.service.interface';
import { AuthError } from '../errors/auth-error.class';
import { HTTPError } from '../errors/http-error.class.js';
import { ILogger } from '../logger/logger.interface.js';
import { TYPES } from '../types.js';
import { UserLoginDto } from './dto/user-login.dto';
import { UserSignupDto } from './dto/user-signup.dto';
import { IUserController } from './users.controller.inteface.js';
import { IUserService } from './users.service.interface';

@injectable()
export class UserController extends BaseController implements IUserController {
	constructor(
		@inject(TYPES.ILogger) private loggerService: ILogger,
		@inject(TYPES.ConfigService) private configService: IConfigService,
		@inject(TYPES.UserService) private userService: IUserService,
		@inject(TYPES.AuthService) private authService: IAuthService,
	) {
		super(loggerService);
		this.bindRoutes([
			{
				path: '/info',
				func: this.info,
				method: 'get',
				middlewares: [new AuthGuardMiddleware(this.authService)],
			},
		]);
	}

	async info({ user }: Request, res: Response<IApiResponse>, next: NextFunction): Promise<void> {
		const userData = await this.userService.getUser({ email: user.email });
		this.ok<Partial<User>>(
			res,
			{
				id: userData?.id,
				email: userData?.email,
			},
			'user',
		);
	}
}
