import { NextFunction, Request, Response } from 'express';
import { BaseController } from '../common/base.controller.js';

export interface IUserController {
	login: (req: Request, res: Response, next: NextFunction) => void;
	signup: (req: Request, res: Response, next: NextFunction) => void;
}