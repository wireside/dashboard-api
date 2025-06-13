import { IsEmail } from 'class-validator';

export class AuthVerificationEmailDto {
	@IsEmail({}, { message: 'Invalid email address' })
	email: string;
}
