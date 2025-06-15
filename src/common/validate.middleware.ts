import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { NextFunction, Request, Response } from 'express';
import { IApiErrorResponse } from './api-response.interface';
import { IMiddleware } from './middleware.interface';

export class ValidateMiddleware implements IMiddleware {
	constructor(private classToValidate: ClassConstructor<object>) {}

	execute({ body }: Request, res: Response<IApiErrorResponse>, next: NextFunction): void {
		const instance = plainToInstance(this.classToValidate, body);
		validate(instance, { validationError: { target: false } }).then((errors) => {
			if (errors.length > 0) {
				return res.status(422).send({
					success: false,
					error: {
						errors: errors.map((error) => {
							let errorMessage: string = '';

							for (const key in error.constraints) {
								if (!errorMessage) {
									errorMessage = error.constraints[key];
								} else {
									errorMessage += `; ${error.constraints[key]}`;
								}
							}

							return {
								message: errorMessage,
								context: 'validation',
								payload: {
									property: error.property,
									value: error.value,
								},
							};
						}),
					},
				});
			}
			next();
		});
	}
}
