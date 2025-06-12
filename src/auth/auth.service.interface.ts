import { AuthSession, User } from '@prisma/client';
import { JwtPayload } from 'jsonwebtoken';
import { UserLoginDto } from '../users/dto/user-login.dto';
import { UserSignupDto } from '../users/dto/user-signup.dto';

export interface IAuthService {
	registerUser: (dto: UserSignupDto) => Promise<User | null>;
	authenticateUser: (dto: UserLoginDto) => Promise<User | null>;
	signAccessToken: (payload: Record<string, any>, secret?: string) => Promise<string>;
	signRefreshToken: (payload: Record<string, any>, secret?: string) => Promise<string>;
	verifyAccessToken: (token: string) => Promise<JwtPayload>;
	verifyRefreshToken: (token: string) => Promise<JwtPayload>;
	updateAuthSession: (
		userId: number,
		token: string,
		oldToken: string,
		expiresAt: Date,
	) => Promise<AuthSession>;
	saveAuthSession: (userId: number, token: string, expiresAt: Date) => Promise<AuthSession>;
	deleteAuthSession: (userId: number, token: string) => Promise<void>;
	verifyStoredRefreshToken: (userId: number, token: string) => Promise<boolean>;
}
