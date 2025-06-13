import { AuthService } from './auth/auth.service';
import { MailService } from './mail/mail.service';

export const TYPES = {
	Application: Symbol.for('Application'),
	ILogger: Symbol.for('ILogger'),
	UserController: Symbol.for('UserController'),
	UserService: Symbol.for('UserService'),
	UserRepository: Symbol.for('UserRepository'),
	ExceptionFilter: Symbol.for('ExceptionFilter'),
	ConfigService: Symbol.for('ConfigService'),
	PrismaService: Symbol.for('PrismaService'),
	AuthController: Symbol.for('AuthController'),
	AuthService: Symbol.for('AuthService'),
	AuthExceptionFilter: Symbol.for('AuthExceptionFilter'),
	AuthRepository: Symbol.for('AuthRepository'),
	MailService: Symbol.for('MailService'),
};
