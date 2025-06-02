import { Container, ContainerModule } from 'inversify';
import { App } from './app.js';
import { IExceptionFilter } from './errors/exception.filter.interface.js';
import { ExceptionFilter } from './errors/exception.filter.js';
import { ILogger } from './logger/logger.interface.js';
import { LoggerService } from './logger/logger.service.js';
import { TYPES } from './types.js';
import { IUserController } from './users/users.controller.inteface.js';
import { UserController } from './users/users.controller.js';
import { UserService } from './users/users.service';
import { IUserService } from './users/users.service.interface';

export type BootstrapReturn = {
	appContainer: Container;
	app: App;
};

export const appBindings = new ContainerModule(({ bind }) => {
	bind<ILogger>(TYPES.ILogger).to(LoggerService);
	bind<IExceptionFilter>(TYPES.ExceptionFilter).to(ExceptionFilter);
	bind<IUserController>(TYPES.UserController).to(UserController);
	bind<IUserService>(TYPES.UserService).to(UserService)
	bind<App>(TYPES.Application).to(App);
});

function bootstrap(): BootstrapReturn {
	const appContainer = new Container();
	appContainer.loadSync(appBindings);

	const app = appContainer.get<App>(TYPES.Application);
	app.init().then();

	return { app, appContainer };
}

export const { app, appContainer } = bootstrap();
