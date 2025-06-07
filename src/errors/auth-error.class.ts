export class AuthError extends Error {
	statusCode: number;
	message: string;
	context?: string;
	tokenPayload?: {
		expired: boolean;
	};

	constructor(
		statusCode: number,
		message: string,
		context?: string,
		tokenPayload?: {
			expired: boolean;
		},
	) {
		super(message);
		this.statusCode = statusCode;
		this.context = context;
		this.tokenPayload = tokenPayload;
	}
}
