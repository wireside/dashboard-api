import { Prisma, User } from '@prisma/client';
import { UserEntity } from './user.entity';

export interface IUserRepository {
	create: (user: UserEntity) => Promise<User>;
	find: (where: Prisma.UserWhereUniqueInput & object) => Promise<User | null>;
	findById: (userId: number) => Promise<User | null>;
	update: (userId: number, data: Partial<User>) => Promise<User>;
}
