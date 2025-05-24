import { Router, Response } from 'express';
import { injectable } from 'inversify';
import { ILogger } from '../logger/logger.interface.js';
import { IBaseController } from './base.controller.interface.js';
import { IControllerRoute } from './route.interface.js';

@injectable()
export abstract class BaseController implements IBaseController {
	private readonly _router: Router;
	
	constructor(private logger: ILogger) {
		this._router = Router();
	}
	
	get router() {
		return this._router;
	}
	
	public send<T>(res: Response, code: number, message: T) {
		res.type('application/json');
		return res.status(code).json(message);
	}
	
	public ok<T>(res: Response, message: T) {
		return this.send<T>(res, 200, message);
	}
	
	public created(res: Response) {
		return res.sendStatus(201);
	}
	
	protected bindRoutes(routes: IControllerRoute[]) {
		for (const route of routes) {
			const { path, func, method } = route;
			const handler = func.bind(this);
			
			this.router[method](path, handler);
			this.logger.log(`[${method}] ${path}`);
		}
	}
}