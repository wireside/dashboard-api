import { Response, Router } from 'express';
import { injectable } from 'inversify';
import { ILogger } from '../logger/logger.interface.js';
import { IBaseController } from './base.controller.interface.js';
import { ExpressReturnType, IControllerRoute } from './route.interface.js';

@injectable()
export abstract class BaseController implements IBaseController {
	private readonly _router: Router;

	constructor(private logger: ILogger) {
		this._router = Router();
	}

	get router(): Router {
		return this._router;
	}

	public send<T>(res: Response, code: number, message: T): ExpressReturnType {
		res.type('application/json');
		return res.status(code).json(message);
	}

	public ok<T>(res: Response, message: T): ExpressReturnType {
		return this.send<T>(res, 200, message);
	}

	public created(res: Response): ExpressReturnType {
		return res.sendStatus(201);
	}

	protected bindRoutes(routes: IControllerRoute[]): void {
		for (const route of routes) {
			const middlewares = route.middlewares?.map((m) => m.execute.bind(m));
			const handler = route.func.bind(this);
			const pipeline = middlewares ? [...middlewares, handler] : handler;
			this.router[route.method](route.path, pipeline);
			this.logger.log(`[${route.method}] ${route.path}`);
		}
	}
}
