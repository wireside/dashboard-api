import { Response, Router } from 'express';
import { IApiResponse } from './api-response.interface';
import { ExpressReturnType, IControllerRoute } from './route.interface.js';

export interface IBaseController {
	get router(): Router;

	send: <T>(res: Response<IApiResponse>, code: number, data: T) => ExpressReturnType<IApiResponse>;
	ok: <T>(res: Response<IApiResponse>, data: T) => ExpressReturnType<IApiResponse>;
	created: <T>(res: Response<IApiResponse>, data: T) => ExpressReturnType<IApiResponse>;
}
