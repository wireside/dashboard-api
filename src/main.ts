import { Container, ContainerModule } from 'inversify';
import { App } from './app';
import { AuthController } from './auth/auth.controller';
import { IAuthController } from './auth/auth.controller.interface';
import { AuthRepository } from './auth/auth.repository';
import { IAuthRepository } from './auth/auth.repository.interface';
import { AuthService } from './auth/auth.service';
import { IAuthService } from './auth/auth.service.interface';
import { ConfigService } from './config/config.service';
import { IConfigService } from './config/config.service.interface';
import { PrismaService } from './database/prisma.service';
import { IPrismaService } from './database/prisma.service.interface';
import { AuthExceptionFilter } from './errors/auth.exception.filter';
import { ExceptionFilter } from './errors/exception.filter';
import { IExceptionFilter } from './errors/exception.filter.interface';
import { ILogger } from './logger/logger.interface';
import { LoggerService } from './logger/logger.service';
import { MailService } from './mail/mail.service';
import { IMailService } from './mail/mail.service.interface';
import { TYPES } from './types';
import { UserController } from './users/users.controller';
import { IUserController } from './users/users.controller.inteface';
import { UserRepository } from './users/users.repository';
import { IUserRepository } from './users/users.repository.interface';
import { UserService } from './users/users.service';
import { IUserService } from './users/users.service.interface';

export type BootstrapReturn = {
	appContainer: Container;
	app: App;
};

export const appBindings = new ContainerModule(({ bind }) => {
	bind<ILogger>(TYPES.ILogger).to(LoggerService).inSingletonScope();
	bind<IExceptionFilter>(TYPES.ExceptionFilter).to(ExceptionFilter);
	bind<IExceptionFilter>(TYPES.AuthExceptionFilter).to(AuthExceptionFilter);
	bind<IAuthController>(TYPES.AuthController).to(AuthController);
	bind<IAuthService>(TYPES.AuthService).to(AuthService).inSingletonScope();
	bind<IAuthRepository>(TYPES.AuthRepository).to(AuthRepository).inSingletonScope();
	bind<IUserController>(TYPES.UserController).to(UserController);
	bind<IUserService>(TYPES.UserService).to(UserService);
	bind<IUserRepository>(TYPES.UserRepository).to(UserRepository).inSingletonScope();
	bind<IConfigService>(TYPES.ConfigService).to(ConfigService).inSingletonScope();
	bind<IPrismaService>(TYPES.PrismaService).to(PrismaService).inSingletonScope();
	bind<IMailService>(TYPES.MailService).to(MailService).inSingletonScope();
	bind<App>(TYPES.Application).to(App).inSingletonScope();
});

async function bootstrap(): Promise<BootstrapReturn> {
	const appContainer = new Container();
	appContainer.loadSync(appBindings);

	const app = appContainer.get<App>(TYPES.Application);
	await app.init();

	return { app, appContainer };
}

export const boot = bootstrap();
