import { App } from './app.js';
import { ExceptionFilter } from './errors/exception.filter.js';
import { LoggerService } from './logger/logger.service.js';
import { UserController } from './users/users.controller.js';

async function bootstrap() {
	const logger = new LoggerService();
	const userController = new UserController(logger);
	const exceptionFilter = new ExceptionFilter(logger)
	const app = new App(logger, userController, exceptionFilter);
	await app.init();
}

bootstrap();