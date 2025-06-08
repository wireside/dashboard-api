import { User } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { JwtPayload, Secret, sign, verify } from 'jsonwebtoken';
import { IConfigService } from '../config/config.service.interface';
import { TYPES } from '../types';
import { IUserRepository } from '../users/users.repository.interface';
import { IAuthService } from './auth.service.interface';

injectable()
export class AuthService implements IAuthService {
	constructor(
		@inject(TYPES.ConfigService) private configService: IConfigService,
		@inject(TYPES.UserRepository) private userRepository: IUserRepository,
	) {}

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

	public async saveRefreshToken(userId: number, token: string): Promise<User> {
		return this.userRepository.update(userId, { refreshToken: token });
	}

	public async deleteRefreshToken(userId: number): Promise<User> {
		return this.userRepository.update(userId, { refreshToken: null });
	}

	public async verifyStoredRefreshToken(userId: number, token: string): Promise<boolean> {
		const user = await this.userRepository.findById(userId);
		return user?.refreshToken == token;
	}
}
