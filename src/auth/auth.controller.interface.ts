import { NextFunction, Request, Response } from 'express';
import { IBaseController } from '../common/base.controller.interface';

export interface IAuthController extends IBaseController {
	login: (req: Request, res: Response, next: NextFunction) => Promise<void>;
	signup: (req: Request, res: Response, next: NextFunction) => Promise<void>;
	logout: (req: Request, res: Response, next: NextFunction) => Promise<void>;
	refresh: (req: Request, res: Response, next: NextFunction) => Promise<void>;
	activate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
