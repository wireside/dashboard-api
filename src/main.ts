import { Container } from 'inversify';
import { App } from './app.js';
import { IExceptionFilter } from './errors/exception.filter.interface.js';
import { ExceptionFilter } from './errors/exception.filter.js';
import { ILogger } from './logger/logger.interface.js';
import { LoggerService } from './logger/logger.service.js';
import { TYPES } from './types.js';
import { UserController } from './users/users.controller.js';


const appContainer = new Container();

appContainer.bind<ILogger>(TYPES.ILogger).to(LoggerService);
appContainer.bind<IExceptionFilter>(TYPES.ExceptionFilter).to(ExceptionFilter);
appContainer.bind<UserController>(TYPES.UserController).to(UserController);
appContainer.bind<App>(TYPES.Application).to(App);

const app = appContainer.get<App>(TYPES.Application);
app.init().then();


export { app, appContainer };