import { IsEmail, IsString } from 'class-validator';

export class UserSignupDto {
	@IsEmail({}, { message: 'Invalid email address' })
	email: string;

	@IsString({ message: 'Missing password' })
	password: string;

	@IsString({ message: 'Name is not specified' })
	name: string;
}
