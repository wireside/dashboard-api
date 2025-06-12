import { AuthSession } from '@prisma/client';

export interface IAuthRepository {
	saveAuthSession: (
		userId: number,
		token: string,
		expiredAt: Date,
		oldToken?: string,
	) => Promise<AuthSession>;
	updateAuthSession: (
		userId: number,
		token: string,
		oldToken: string,
		expiresAt: Date,
	) => Promise<AuthSession>;
	findAuthSession: (userId: number, token: string) => Promise<AuthSession | null>;
	deleteAuthSession: (userId: number, token: string) => Promise<void>;
}
