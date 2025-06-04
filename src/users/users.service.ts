import { inject, injectable } from 'inversify';
import { IConfigService } from '../config/config.service.interface';
import { TYPES } from '../types';
import { UserLoginDto } from './dto/user-login.dto';
import { UserSignupDto } from './dto/user-signup.dto';
import { User } from './user.entity';
import { IUserService } from './users.service.interface';

@injectable()
export class UserService implements IUserService {
	constructor(@inject(TYPES.ConfigService) private configService: IConfigService) {}
	
	async createUser({ email, name, password }: UserSignupDto): Promise<User | null> {
		const newUser = new User(email, name);
		const salt = this.configService.get('SALT');
		await newUser.setPassword(password, Number(salt));
		console.log(salt);
		// check if user exists
		// in case it does return null
		// else create and return new user
		return null
	}

	async validateUser(dto: UserLoginDto): Promise<boolean> {
		return true
	}
}
