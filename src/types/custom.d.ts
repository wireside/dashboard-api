declare namespace Express {
	import { JwtPayload } from 'jsonwebtoken';
	
	export interface Request {
		user: string | JwtPayload;
	}
}
