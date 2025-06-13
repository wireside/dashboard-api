import { AuthSession, User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { inject, injectable } from 'inversify';
import { JwtPayload, Secret, sign, verify } from 'jsonwebtoken';
import crypto from 'node:crypto';
import { IConfigService } from '../config/config.service.interface';
import { AuthError } from '../errors/auth-error.class';
import { HTTPError } from '../errors/http-error.class';
import { ILogger } from '../logger/logger.interface';
import { IMailService } from '../mail/mail.service.interface';
import { getVerificationLetter } from '../mail/mail.verification-letter';
import { TYPES } from '../types';
import { UserLoginDto } from '../users/dto/user-login.dto';
import { UserSignupDto } from '../users/dto/user-signup.dto';
import { IUserService } from '../users/users.service.interface';
import { IAuthRepository } from './auth.repository.interface';
import { IAuthService } from './auth.service.interface';

@injectable()
export class AuthService implements IAuthService {
	constructor(
		@inject(TYPES.ConfigService) private configService: IConfigService,
		@inject(TYPES.UserService) private userService: IUserService,
		@inject(TYPES.AuthRepository) private authRepository: IAuthRepository,
		@inject(TYPES.MailService) private mailService: IMailService,
		@inject(TYPES.ILogger) private logger: ILogger,
	) {}

	public async registerUser(userSignupDto: UserSignupDto): Promise<User | null> {
		const user = await this.userService.createUser(userSignupDto);

		if (user) {
			const token = await this.generateVerificationToken(user.id);
			if (!token) {
				throw new HTTPError(500, 'Failed to create verification token', 'auth:signup');
			}

			this.sendVerificationEmail(user.id, user.email, token).then(() =>
				this.logger.log(`[AuthService] sent verification email to ${user.email}`),
			);

			return user;
		}

		return user;
	}

	public async authenticateUser({ email, password }: UserLoginDto): Promise<User | null> {
		const user = await this.userService.validateUser({ email, password });

		if (!user) {
			return null;
		}

		if (!user.isActive) {
			throw new AuthError(403, "User's email is not verified", 'auth:login');
		}

		return user;
	}

	public signAccessToken(payload: Record<string, any>, secret?: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			sign(
				{
					...payload,
					iat: Math.floor(Date.now() / 1000),
				},
				secret ?? this.configService.get('JWT_SECRET_KEY'),
				{
					algorithm: 'HS256',
					expiresIn: '15m',
				},
				(error, token) => {
					if (error) {
						reject(error);
					}
					resolve(token as string);
				},
			);
		});
	}

	public signRefreshToken(payload: Record<string, any>, secret?: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			sign(
				{
					...payload,
					iat: Math.floor(Date.now() / 1000),
				},
				secret ?? this.configService.get('JWT_REFRESH_SECRET_KEY'),
				{
					algorithm: 'HS256',
					expiresIn: '7d',
				},
				(error, token) => {
					if (error) {
						reject(error);
					}
					resolve(token as string);
				},
			);
		});
	}

	private verifyToken(token: string, secretKey: string): Promise<JwtPayload> {
		return new Promise<JwtPayload>((resolve, reject) => {
			verify(token, secretKey, (error, payload) => {
				if (error) {
					reject(error);
				}
				resolve(payload as JwtPayload);
			});
		});
	}

	public verifyAccessToken(token: string): Promise<JwtPayload> {
		const secretKey: Secret = this.configService.get('JWT_SECRET_KEY');
		return this.verifyToken(token, secretKey);
	}

	public verifyRefreshToken(token: string): Promise<JwtPayload> {
		const refreshSecretKey: Secret = this.configService.get('JWT_REFRESH_SECRET_KEY');
		return this.verifyToken(token, refreshSecretKey);
	}

	public async saveAuthSession(
		userId: number,
		token: string,
		expiresAt: Date,
	): Promise<AuthSession> {
		return this.authRepository.saveAuthSession(userId, token, expiresAt);
	}

	public async updateAuthSession(
		userId: number,
		token: string,
		oldToken: string,
		expiresAt: Date,
	): Promise<AuthSession> {
		return this.authRepository.updateAuthSession(userId, token, oldToken, expiresAt);
	}

	public async deleteAuthSession(userId: number, refreshToken: string): Promise<void> {
		return this.authRepository.deleteAuthSession(userId, refreshToken);
	}

	public async verifyStoredRefreshToken(userId: number, token: string): Promise<boolean> {
		const authSession = await this.authRepository.findAuthSession(userId, token);
		return !!authSession?.refreshToken;
	}

	public async generateVerificationToken(userId: number): Promise<string> {
		let isUnique: boolean = false;
		let token: string;
		let attempts: number = 0;

		while (!isUnique && attempts < 15) {
			attempts++;
			token = crypto.randomBytes(32).toString('hex');

			try {
				const verificationToken = await this.authRepository.createVerificationToken(
					userId,
					token,
					new Date(Date.now() + Number(this.configService.get('ACTIVATE_LINK_EXPIRES_IN'))),
				);

				isUnique = true;
				return token;
			} catch (err) {
				if ((err as PrismaClientKnownRequestError).code === 'P2002') {
					continue;
				}
				throw err;
			}
		}

		if (!isUnique) {
			throw new Error('Failed to create unique verification-token');
		}

		return token!;
	}

	public async verifyEmail(userId: number, token: string): Promise<User> {
		const verificationToken = await this.authRepository.findVerificationToken(userId, token);

		if (!verificationToken) {
			throw new AuthError(400, 'Invalid verification token', 'auth:activate');
		}

		if (verificationToken.expiresAt < new Date(Date.now())) {
			throw new AuthError(498, 'Verification token is expired', 'auth:activate');
		}

		const user = await this.userService.activateUser(verificationToken.userId);

		await this.authRepository.deleteVerificationToken(
			verificationToken.userId,
			verificationToken.token,
		);

		return user;
	}

	public async resendVerificationEmail(email: string): Promise<void> {
		const user = await this.userService.getUser({ email });
		if (!user) {
			throw new AuthError(400, 'User with given email does not exist', 'auth:resend-verification');
		}

		if (user.isActive) {
			throw new AuthError(422, 'User is already active and verified');
		}

		const token = await this.generateVerificationToken(user.id);
		this.sendVerificationEmail(user.id, user.email, token).then(() =>
			this.logger.log('[AuthService] sent verification email to ${user.email}'),
		);
	}

	private async sendVerificationEmail(userId: number, email: string, token: string): Promise<void> {
		const base = `${this.configService.get('APP_URL')}:${this.configService.get('APP_PORT')}`;
		const verificationUrl = `${base}/auth/activate/${userId}/${token}`;
		await this.mailService.sendEmail(
			this.configService.get('MAIL_FROM'),
			email,
			'Подтверждение регистрации',
			getVerificationLetter(verificationUrl),
		);
	}
}
