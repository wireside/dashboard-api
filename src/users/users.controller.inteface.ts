import { NextFunction, Request, Response } from 'express';
import { IBaseController } from '../common/base.controller.interface.js';
import { BaseController } from '../common/base.controller.js';

export interface IUserController extends IBaseController {
	login: (req: Request, res: Response, next: NextFunction) => void;
	signup: (req: Request, res: Response, next: NextFunction) => void;
}
