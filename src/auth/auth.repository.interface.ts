import { AuthSession, VerificationToken } from '@prisma/client';

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
	createVerificationToken: (
		userId: number,
		token: string,
		expiresAt: Date,
	) => Promise<VerificationToken>;
	deleteVerificationToken: (userId: number, token: string) => Promise<void>;
	findVerificationToken: (userId: number, token: string) => Promise<VerificationToken | null>;
}
