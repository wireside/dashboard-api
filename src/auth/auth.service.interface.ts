import { User } from '@prisma/client';
import { JwtPayload, VerifyErrors } from 'jsonwebtoken';

type a = VerifyErrors;

export interface IAuthService {
	signAccessToken: (payload: Record<string, any>, secret?: string) => Promise<string>;
	signRefreshToken: (payload: Record<string, any>, secret?: string) => Promise<string>;
	verifyAccessToken: (token: string) => Promise<JwtPayload>;
	verifyRefreshToken: (token: string) => Promise<JwtPayload>;
	saveRefreshToken: (userId: number, token: string) => Promise<User>;
	deleteRefreshToken: (userId: number) => Promise<User>;
	verifyStoredRefreshToken: (userId: number, token: string) => Promise<boolean>;
}
