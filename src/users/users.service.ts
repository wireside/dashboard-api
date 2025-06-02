import { injectable } from 'inversify';
import { UserLoginDto } from './dto/user-login.dto';
import { UserSignupDto } from './dto/user-signup.dto';
import { User } from './user.entity';
import { IUserService } from './users.service.interface';

@injectable()
export class UserService implements IUserService {
	async createUser({ email, name, password }: UserSignupDto): Promise<User | null> {
		const newUser = new User(email, name);
		await newUser.setPassword(password);
		// check if user exists
		// if it does return null
		// else create and return new user
		return null
	}

	async validateUser(dto: UserLoginDto): Promise<boolean> {
		return true
	}
}
