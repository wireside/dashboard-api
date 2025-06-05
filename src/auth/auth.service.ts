import { inject, injectable } from 'inversify';
import { Secret, sign, verify } from 'jsonwebtoken';
import { IConfigService } from '../config/config.service.interface';
import { TYPES } from '../types';
import { IAuthService, VerifyDecodedPayload } from './auth.service.interface';

injectable();

export class AuthService implements IAuthService {
	constructor(@inject(TYPES.ConfigService) private configService: IConfigService) {}

	signJWT(email: string): Promise<string> {
		const secretKey: Secret = this.configService.get('SECRET_KEY');
		return new Promise<string>((resolve, reject) => {
			sign(
				{
					email,
					iat: Math.floor(Date.now() / 1000),
				},
				secretKey,
				{
					algorithm: 'HS256',
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

	verifyJWT(token: string): Promise<VerifyDecodedPayload> {
		const secretKey: Secret = this.configService.get('SECRET_KEY');
		return new Promise<VerifyDecodedPayload>((resolve, reject) => {
			verify(token, secretKey, (error, payload) => {
				if (error) {
					reject(error);
				}
				resolve(payload as VerifyDecodedPayload);
			});
		});
	}
}
