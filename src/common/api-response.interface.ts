export interface IApiResponse<T = any> {
	success: boolean;
	data: T | null;
	meta?: Record<string, any>;
}

export interface IApiErrorResponse {
	success: boolean;
	error: IApiError | null;
	meta?: Record<string, any>;
}

export interface IApiError {
	statusCode: number;
	errors: IError[];
	stack?: string | undefined;
}

export interface IError {
	message: string;
	context?: string;
	payload?: Record<string, any>;
}
