import { App } from './app.js';
import { ExceptionFilter } from './errors/exception.filter.js';
import { LoggerService } from './logger/logger.service.js';
import { UserController } from './users/users.controller.js';

async function bootstrap() {
	const logger = new LoggerService();
	const app = new App(
		logger,
		new UserController(logger),
		new ExceptionFilter(logger),
	);
	await app.init();
}

bootstrap();