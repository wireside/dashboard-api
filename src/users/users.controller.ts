import { User } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { JsonWebTokenError, JwtPayload, TokenExpiredError } from 'jsonwebtoken';
import { AuthGuardMiddleware } from '../auth/auth.guard.middleware';
import { IAuthService } from '../auth/auth.service.interface';
import { BaseController } from '../common/base.controller.js';
import { ValidateMiddleware } from '../common/validate.middleware';
import { IConfigService } from '../config/config.service.interface';
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
				path: '/logout',
				func: this.logout,
				method: 'post',
				middlewares: [new AuthGuardMiddleware(this.authService, 'users/logout')],
			},
			{
				path: '/info',
				func: this.info,
				method: 'get',
				middlewares: [new AuthGuardMiddleware(this.authService)],
			},
			{
				path: '/refresh',
				func: this.refresh,
				method: 'post',
				middlewares: [],
			},
		]);
	}

	async login(
		{ body }: Request<{}, {}, UserLoginDto>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		const user = await this.userService.authenticateUser(body);
		if (!user) {
			return next(new HTTPError(401, 'Authorization failed', 'users/login'));
		}

		const payload = {
			id: user.id,
			email: user.email,
		};
		const accessToken: string = await this.authService.signAccessToken(payload);
		const refreshToken: string = await this.authService.signRefreshToken(payload);

		await this.authService.saveRefreshToken(Number(user.id), refreshToken);

		res.cookie('refreshToken', refreshToken, {
			httpOnly: true,
			secure: this.configService.get('PRODUCTION')
				? this.configService.get('PRODUCTION').toLowerCase() === 'true'
				: false,
			sameSite: 'strict',
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});

		this.ok(res, { accessToken });
	}

	async signup(
		{ body }: Request<{}, {}, UserSignupDto>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		const result = await this.userService.createUser(body);
		if (!result) {
			return next(new HTTPError(422, 'User is already exists', 'users/signup'));
		}
		this.ok<Partial<User>>(res, {
			id: result.id,
			email: result.email,
			name: result.name,
		});
	}

	async logout(
		req: Request<{}, {}, UserSignupDto>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const refreshToken = req.cookies.refreshToken;

			if (refreshToken) {
				const payload = await this.authService.verifyRefreshToken(refreshToken);
				await this.authService.deleteRefreshToken(Number(payload.id));
			}

			res.clearCookie('refreshToken');

			this.ok(res, { message: 'Logged out successfully' });
		} catch (e) {
			return next(new HTTPError(401, 'Invalid refresh token', 'users/logout'));
		}
	}

	async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const refreshToken = req.cookies.refreshToken;

			if (!refreshToken) {
				return next(new HTTPError(401, 'Missing refresh token', 'users/refresh'));
			}

			const { email }: JwtPayload = await this.authService.verifyRefreshToken(refreshToken);

			const user = await this.userService.getUser({ email });
			if (!user) {
				return next(new HTTPError(404, 'User not found', 'users/refresh'));
			}

			const isValid = await this.authService.verifyStoredRefreshToken(user.id, refreshToken);
			if (!isValid) {
				return next(new HTTPError(401, 'Invalid refresh token', 'users/refresh'));
			}

			const payload = {
				id: user.id,
				email: user.email,
			};
			const newAccessToken = await this.authService.signAccessToken(payload);
			const newRefreshToken = await this.authService.signRefreshToken(payload);

			await this.authService.saveRefreshToken(Number(user.id), newRefreshToken);

			res.cookie('refreshToken', newRefreshToken, {
				httpOnly: true,
				secure: this.configService.get('PRODUCTION')
					? this.configService.get('PRODUCTION').toLowerCase() === 'true'
					: false,
				sameSite: 'strict',
				maxAge: 7 * 24 * 60 * 60 * 1000,
			});

			this.ok(res, { accessToken: newAccessToken });
		} catch (e) {
			if (e instanceof TokenExpiredError) {
				this.send(res, 302, 'Refresh token expired, please login again');
			} else if (e instanceof JsonWebTokenError) {
				return next(new HTTPError(401, 'Invalid refresh token', 'users/refresh'));
			}

			return next(
				new HTTPError(500, 'Internal server error while verifying refresh token', 'users/refresh'),
			);
		}
	}

	async info(
		{ user }: Request<{}, {}, UserSignupDto>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		const userData = await this.userService.getUser({ email: user.email });
		this.ok(res, {
			id: userData?.id,
			email: userData?.email,
		});
	}
}
