import { Container, ContainerModule } from 'inversify';
import { App } from './app';
import { ConfigService } from './config/config.service';
import { IConfigService } from './config/config.service.interface';
import { ExceptionFilter } from './errors/exception.filter';
import { IExceptionFilter } from './errors/exception.filter.interface';
import { ILogger } from './logger/logger.interface';
import { LoggerService } from './logger/logger.service';
import { TYPES } from './types';
import { UserController } from './users/users.controller';
import { IUserController } from './users/users.controller.inteface';
import { UserService } from './users/users.service';
import { IUserService } from './users/users.service.interface';

export type BootstrapReturn = {
	appContainer: Container;
	app: App;
};

export const appBindings = new ContainerModule(({ bind }) => {
	bind<ILogger>(TYPES.ILogger).to(LoggerService).inSingletonScope();
	bind<IExceptionFilter>(TYPES.ExceptionFilter).to(ExceptionFilter);
	bind<IUserController>(TYPES.UserController).to(UserController);
	bind<IUserService>(TYPES.UserService).to(UserService);
	bind<IConfigService>(TYPES.ConfigService).to(ConfigService).inSingletonScope();
	bind<App>(TYPES.Application).to(App).inSingletonScope();
});

function bootstrap(): BootstrapReturn {
	const appContainer = new Container();
	appContainer.loadSync(appBindings);

	const app = appContainer.get<App>(TYPES.Application);
	app.init().then();

	return { app, appContainer };
}

export const { app, appContainer } = bootstrap();
