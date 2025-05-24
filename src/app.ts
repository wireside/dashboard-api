import express, { Express } from 'express';
import { inject, injectable } from 'inversify';
import { ExceptionFilter } from './errors/exception.filter.js';
import { ILogger } from './logger/logger.interface.js';
import { Server } from 'http';
import { TYPES } from './types.js';
import { IUserController } from './users/users.controller.inteface.js';

@injectable()
export class App {
	app: Express;
	server: Server;
	port: number;

	constructor(
		@inject(TYPES.ILogger) private logger: ILogger,
		@inject(TYPES.UserController) private userController: IUserController,
		@inject(TYPES.ExceptionFilter) private exceptionFilter: ExceptionFilter,
	) {
		this.app = express();
		this.port = 8000;
	}

	useRoutes(): void {
		this.app.use('/users', this.userController.router);
	}

	useExceptionFilters(): void {
		this.app.use(this.exceptionFilter.catch.bind(this.exceptionFilter));
	}

	public async init(): Promise<void> {
		this.useRoutes();
		this.useExceptionFilters();
		this.server = this.app.listen(this.port, () => {
			this.logger.log(`Server is running on http://localhost:${this.port}`);
		});
	}
}
