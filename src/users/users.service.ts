import { Prisma, User } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { IConfigService } from '../config/config.service.interface';
import { TYPES } from '../types';
import { UserLoginDto } from './dto/user-login.dto';
import { UserSignupDto } from './dto/user-signup.dto';
import { UserEntity } from './user.entity';
import { IUserRepository } from './users.repository.interface';
import { IUserService } from './users.service.interface';

@injectable()
export class UserService implements IUserService {
	constructor(
		@inject(TYPES.ConfigService) private configService: IConfigService,
		@inject(TYPES.UserRepository) private userRepository: IUserRepository,
	) {}

	public async createUser({ email, name, password }: UserSignupDto): Promise<User | null> {
		const newUser = new UserEntity(email, name);
		const salt = this.configService.get('SALT');
		await newUser.setPassword(password, Number(salt));
		const existedUser = await this.userRepository.find({ email: newUser.email });
		if (existedUser) {
			return null;
		}
		return this.userRepository.create(newUser);
	}

	public async authenticateUser({ email, password }: UserLoginDto): Promise<User | null> {
		const existedUser = await this.userRepository.find({ email });
		if (!existedUser) {
			return null;
		}
		
		const userToValidate = new UserEntity(
			existedUser.email,
			existedUser.name,
			existedUser.password,
		);
		if (await userToValidate.comparePassword(password)) {
			return existedUser;
		}

		return null;
	}

	public async getUser(where: Prisma.UserWhereUniqueInput): Promise<User | null> {
		return this.userRepository.find(where);
	}

	public async getUserById(userId: number): Promise<User | null> {
		return this.userRepository.findById(userId);
	}
}
