import { Server } from 'node:http'
import bodyParser from 'body-parser';
import express, { Express } from 'express';
import { inject, injectable } from 'inversify';
import { IConfigService } from './config/config.service.interface';
import { ExceptionFilter } from './errors/exception.filter';
import { ILogger } from './logger/logger.interface';
import { TYPES } from './types';
import { IUserController } from './users/users.controller.inteface';

@injectable()
export class App {
	app: Express;
	server: Server;
	port: number;

	constructor(
		@inject(TYPES.ILogger) private logger: ILogger,
		@inject(TYPES.UserController) private userController: IUserController,
		@inject(TYPES.ExceptionFilter) private exceptionFilter: ExceptionFilter,
		@inject(TYPES.ConfigService) private configService: IConfigService,
	) {
		this.app = express();
		this.port = 8000;
	}

	useMiddleware(): void {
		this.app.use(bodyParser.json());
	}

	useRoutes(): void {
		this.app.use('/users', this.userController.router);
	}

	useExceptionFilters(): void {
		this.app.use(this.exceptionFilter.catch.bind(this.exceptionFilter));
	}

	public async init(): Promise<void> {
		this.useMiddleware();
		this.useRoutes();
		this.useExceptionFilters();
		this.server = this.app.listen(this.port, () => {
			this.logger.log(`Server is running on http://localhost:${this.port}`);
		});
	}
}
