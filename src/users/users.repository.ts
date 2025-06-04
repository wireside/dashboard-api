import { User } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { PrismaService } from '../database/prisma.service';
import { TYPES } from '../types';
import { UserEntity } from './user.entity';
import { IUserRepository } from './users.repository.interface';

@injectable()
export class UserRepository implements IUserRepository {
	constructor(@inject(TYPES.PrismaService) private prismaService: PrismaService) {}

	public async create({ email, name, password }: UserEntity): Promise<User> {
		return this.prismaService.client.user.create({
			data: {
				email,
				name,
				password,
			},
		});
	}

	public async find(email: string): Promise<User | null> {
		return this.prismaService.client.user.findUnique({
			where: {
				email,
			},
		});
	}
}
