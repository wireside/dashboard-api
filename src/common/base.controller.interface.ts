import { Response, Router } from 'express';
import { IControllerRoute } from './route.interface.js';

export interface IBaseController {
	get router(): Router;
	
	send: <T>(res: Response, code: number, message: T) => Response<any, Record<string, any>>;
	ok: <T>(res: Response, message: T) => Response<any, Record<string, any>>;
	created: (res: Response) => Response<any, Record<string, any>>;
}