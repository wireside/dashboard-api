export interface IApiResponse<T = any> {
	success: boolean;
	data: T | null;
	meta?: Record<string, any>;
}

export interface IApiErrorResponse {
	success: boolean;
	error: IAuthApiError | IApiError | null;
	meta?: Record<string, any>;
}

export interface IApiError {
	errors: IError[];
	stack?: string | undefined;
}

export interface IAuthApiError extends IApiError {
	token?: {
		expired: boolean;
	};
}

export interface IError {
	message: string;
	context?: string;
	payload?: Record<string, any>;
}
