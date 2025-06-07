import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import express, { Express } from 'express';
import { inject, injectable } from 'inversify';
import { Server } from 'node:http';
import { AuthMiddleware } from './auth/auth.middleware';
import { IAuthService } from './auth/auth.service.interface';
import { IPrismaService } from './database/prisma.service.interface';
import { ExceptionFilter } from './errors/exception.filter';
import { ILogger } from './logger/logger.interface';
import { LogMiddleware } from './logger/logger.middleware';
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
		@inject(TYPES.PrismaService) private prismaService: IPrismaService,
		@inject(TYPES.AuthService) private authService: IAuthService,
	) {
		this.app = express();
		this.port = 8000;
	}

	useMiddleware(): void {
		this.app.use(bodyParser.json());
		this.app.use(cookieParser());
		const logMiddleware = new LogMiddleware(this.logger);
		this.app.use(logMiddleware.execute.bind(logMiddleware));
		const authMiddleware = new AuthMiddleware(this.authService);
		this.app.use(authMiddleware.execute.bind(authMiddleware));
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
		await this.prismaService.connect();
		this.server = this.app.listen(this.port, () => {
			this.logger.log(`Server is running on http://localhost:${this.port}`);
		});
	}
}
