import { JwtPayload } from 'jsonwebtoken';

export type VerifyDecodedPayload = string | JwtPayload;

export interface IAuthService {
	signJWT: (email: string) => Promise<string>;
	verifyJWT: (token: string) => Promise<VerifyDecodedPayload>;
}
