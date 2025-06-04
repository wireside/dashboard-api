import { User } from '@prisma/client';
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

	async createUser({ email, name, password }: UserSignupDto): Promise<User | null> {
		const newUser = new UserEntity(email, name);
		const salt = this.configService.get('SALT');
		await newUser.setPassword(password, Number(salt));
		const existedUser = await this.userRepository.find(newUser.email);
		if (existedUser) {
			return null;
		}

		return this.userRepository.create(newUser);
	}

	async validateUser(dto: UserLoginDto): Promise<boolean> {
		return true;
	}
}
