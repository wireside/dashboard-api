import { User } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { JsonWebTokenError, JwtPayload, TokenExpiredError } from 'jsonwebtoken';
import { IApiResponse } from '../common/api-response.interface';
import { BaseController } from '../common/base.controller';
import { ValidateMiddleware } from '../common/validate.middleware';
import { IConfigService } from '../config/config.service.interface';
import { AuthError } from '../errors/auth-error.class';
import { HTTPError } from '../errors/http-error.class';
import { ILogger } from '../logger/logger.interface';
import { TYPES } from '../types';
import { UserLoginDto } from '../users/dto/user-login.dto';
import { UserSignupDto } from '../users/dto/user-signup.dto';
import { IUserService } from '../users/users.service.interface';
import { IAuthController } from './auth.controller.interface';
import { AuthGuardMiddleware } from './auth.guard.middleware';
import { IAuthService } from './auth.service.interface';

@injectable()
export class AuthController extends BaseController implements IAuthController {
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
				path: '/refresh',
				func: this.refresh,
				method: 'post',
				middlewares: [],
			},
		]);
	}

	async login(
		{ body }: Request<{}, {}, UserLoginDto>,
		res: Response<IApiResponse>,
		next: NextFunction,
	): Promise<void> {
		const user = await this.authService.authenticateUser(body);
		if (!user) {
			return next(new AuthError(401, 'Authorization failed', 'auth:login'));
		}

		const payload = {
			id: user.id,
			email: user.email,
		};
		const accessToken: string = await this.authService.signAccessToken(payload);
		const refreshToken: string = await this.authService.signRefreshToken(payload);

		await this.authService.saveAuthSession(
			Number(user.id),
			refreshToken,
			new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		);

		this.sendRefreshTokenByCookie(res, refreshToken);

		this.ok(res, { accessToken }, 'auth');
	}

	async signup(
		{ body }: Request<{}, {}, UserSignupDto>,
		res: Response<IApiResponse>,
		next: NextFunction,
	): Promise<void> {
		const result = await this.authService.registerUser(body);
		if (!result) {
			return next(new AuthError(422, 'User is already exists', 'auth:signup'));
		}

		this.created<Partial<User>>(
			res,
			{
				id: result.id,
				email: result.email,
				name: result.name,
			},
			'user',
		);
	}

	async logout(req: Request, res: Response<IApiResponse>, next: NextFunction): Promise<void> {
		try {
			const refreshToken = req.cookies.refreshToken;

			if (refreshToken) {
				const payload = await this.authService.verifyRefreshToken(refreshToken);
				await this.authService.deleteAuthSession(Number(payload.id), refreshToken);
			}

			res.clearCookie('refreshToken');

			this.ok(res, { message: 'Logged out successfully' }, 'auth');
		} catch (e) {
			return next(new AuthError(401, 'Invalid refresh token', 'auth:logout'));
		}
	}

	async refresh(req: Request, res: Response<IApiResponse>, next: NextFunction): Promise<void> {
		try {
			const refreshToken = req.cookies.refreshToken;

			if (!refreshToken) {
				return next(new AuthError(401, 'Missing refresh token', 'auth:refresh'));
			}

			const { email, id }: JwtPayload = await this.authService.verifyRefreshToken(refreshToken);

			const user = await this.userService.getUser({ email, id });
			if (!user) {
				return next(new AuthError(404, 'User not found', 'auth:refresh'));
			}

			const isValid = await this.authService.verifyStoredRefreshToken(user.id, refreshToken);
			if (!isValid) {
				return next(new AuthError(401, 'Invalid refresh token', 'auth:refresh'));
			}

			const payload = {
				id: user.id,
				email: user.email,
			};
			const newAccessToken = await this.authService.signAccessToken(payload);
			const newRefreshToken = await this.authService.signRefreshToken(payload);

			await this.authService.updateAuthSession(
				Number(user.id),
				newRefreshToken,
				refreshToken,
				new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			);

			this.sendRefreshTokenByCookie(res, newRefreshToken);

			this.ok(res, { accessToken: newAccessToken }, 'auth');
		} catch (e) {
			if (e instanceof TokenExpiredError) {
				this.send(
					res,
					302,
					{
						refreshToken: { expired: true },
						message: 'Refresh token expired, please login again',
					},
					'auth',
				);
			} else if (e instanceof JsonWebTokenError) {
				return next(new AuthError(401, 'Invalid refresh token', 'auth:refresh'));
			}

			return next(
				new HTTPError(500, 'Internal server error while verifying refresh token', 'auth:refresh'),
			);
		}
	}

	private sendRefreshTokenByCookie(res: Response, refreshToken: string): void {
		res.cookie('refreshToken', refreshToken, {
			httpOnly: true,
			secure: this.configService.get('PRODUCTION')
				? this.configService.get('PRODUCTION').toLowerCase() === 'true'
				: false,
			sameSite: 'strict',
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});
	}
}
