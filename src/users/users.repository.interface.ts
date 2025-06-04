import { User } from '@prisma/client';
import { UserEntity } from './user.entity';

export interface IUserRepository {
	create: (user: UserEntity) => Promise<User>;
	find: (email: string) => Promise<User | null>;
}
