import { Response, Router } from 'express';
import { injectable } from 'inversify';
import { ILogger } from '../logger/logger.interface.js';
import { IApiResponse } from './api-response.interface';
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

	public send<T>(
		res: Response<IApiResponse>,
		code: number,
		data: T,
		context?: string,
	): ExpressReturnType<IApiResponse> {
		res.type('application/json');
		
		if (context) {
			return res.status(code).json({
				success: true,
				data: {
					[context]: {
						...data,
					},
				},
			});
		}
		
		return res.status(code).json({
			success: true,
			data,
		});
	}

	public ok<T>(
		res: Response<IApiResponse>,
		data: T,
		context?: string,
	): ExpressReturnType<IApiResponse> {
		return this.send<T>(res, 200, data, context);
	}

	public created<T>(
		res: Response<IApiResponse>,
		data: T,
		context?: string,
	): ExpressReturnType<IApiResponse> {
		return this.send<T>(res, 201, data, context);
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
