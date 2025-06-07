import { Response, Router } from 'express';
import { IApiResponse } from './api-response.interface';
import { ExpressReturnType } from './route.interface.js';

export interface IBaseController {
	get router(): Router;

	send: <T>(
		res: Response<IApiResponse>,
		code: number,
		data: T,
		context?: string,
	) => ExpressReturnType<IApiResponse>;
	ok: <T>(
		res: Response<IApiResponse>,
		data: T,
		context?: string,
	) => ExpressReturnType<IApiResponse>;
	created: <T>(
		res: Response<IApiResponse>,
		data: T,
		context?: string,
	) => ExpressReturnType<IApiResponse>;
}
