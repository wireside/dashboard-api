import { NextFunction, Request, Response } from 'express';
import { IBaseController } from '../common/base.controller.interface.js';
import { BaseController } from '../common/base.controller.js';

export interface IUserController extends IBaseController {
	login: (req: Request, res: Response, next: NextFunction) => Promise<void>;
	signup: (req: Request, res: Response, next: NextFunction) => Promise<void>;
	logout: (req: Request, res: Response, next: NextFunction) => Promise<void>;
	refresh: (req: Request, res: Response, next: NextFunction) => Promise<void>;
	info: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
