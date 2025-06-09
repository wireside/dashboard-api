import { Prisma, User } from '@prisma/client';
import { UserLoginDto } from './dto/user-login.dto';
import { UserSignupDto } from './dto/user-signup.dto';

export interface IUserService {
	createUser: (dto: UserSignupDto) => Promise<User | null>;
	validateUser: (dto: UserLoginDto) => Promise<User | null>;
	getUser: (where: Prisma.UserWhereUniqueInput) => Promise<User | null>;
	getUserById: (userId: number) => Promise<User | null>;
}
