import { AuthSession, User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Container } from 'inversify';
import { decode, JsonWebTokenError, JwtPayload, sign } from 'jsonwebtoken';
import crypto from 'node:crypto';
import { IConfigService } from '../config/config.service.interface';
import { AuthError } from '../errors/auth-error.class';
import { ILogger } from '../logger/logger.interface';
import { IMailService } from '../mail/mail.service.interface';
import { TYPES } from '../types';
import { UserLoginDto } from '../users/dto/user-login.dto';
import { UserSignupDto } from '../users/dto/user-signup.dto';
import { IUserService } from '../users/users.service.interface';
import { IAuthRepository } from './auth.repository.interface';
import { AuthService } from './auth.service';
import { IAuthService } from './auth.service.interface';

const enum secrets {
	JWT_SECRET_KEY = 'JWT_SECRET_KEY',
	JWT_REFRESH_SECRET_KEY = 'JWT_REFRESH_SECRET_KEY',
}

const LoggerMock: ILogger = {
	logger: undefined,
	log: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
};

const ConfigServiceMock: IConfigService = {
	get: jest.fn(),
};

const MailServiceMock: IMailService = {
	sendEmail: jest.fn(),
};

const AuthRepositoryMock: IAuthRepository = {
	saveAuthSession: jest.fn(),
	updateAuthSession: jest.fn(),
	findAuthSession: jest.fn(),
	deleteAuthSession: jest.fn(),
	createVerificationToken: jest.fn(),
	deleteVerificationToken: jest.fn(),
	findVerificationToken: jest.fn(),
};

const UserServiceMock: IUserService = {
	createUser: jest.fn(),
	validateUser: jest.fn(),
	getUser: jest.fn(),
	getUserById: jest.fn(),
	activateUser: jest.fn(),
	deactivateUser: jest.fn(),
};

const container = new Container();
let configService: IConfigService;
let mailService: IMailService;
let authRepository: IAuthRepository;
let userService: IUserService;
let authService: IAuthService;

beforeAll(() => {
	container.bind<IConfigService>(TYPES.ConfigService).toConstantValue(ConfigServiceMock);
	container.bind<ILogger>(TYPES.ILogger).toConstantValue(LoggerMock);
	container.bind<IMailService>(TYPES.MailService).toConstantValue(MailServiceMock);
	container.bind<IAuthRepository>(TYPES.AuthRepository).toConstantValue(AuthRepositoryMock);
	container.bind<IUserService>(TYPES.UserService).toConstantValue(UserServiceMock);
	container.bind<IAuthService>(TYPES.AuthService).to(AuthService);

	authService = container.get<IAuthService>(TYPES.AuthService);
	userService = container.get<IUserService>(TYPES.UserService);
	authRepository = container.get<IAuthRepository>(TYPES.AuthRepository);
	mailService = container.get<IMailService>(TYPES.MailService);
	configService = container.get<IConfigService>(TYPES.ConfigService);
});

beforeEach(() => {
	jest.clearAllMocks();
});

describe('Auth Service', () => {
	describe('registerUser', () => {
		const userData: UserSignupDto = {
			email: 'new-user@email.com',
			name: 'test_name',
			password: 'testPassword',
		};

		it('should register new user when user data is valid', async () => {
			userService.createUser = jest.fn().mockImplementationOnce((dto: UserSignupDto): User => {
				return {
					id: 1,
					email: dto.email,
					name: dto.name,
					password: dto.password,
					createdAt: new Date(),
					updatedAt: new Date(),
					isActive: false,
				};
			});

			const user = await authService.registerUser(userData);

			expect(user).not.toBeNull();
			expect(user?.id).toEqual(1);
		});

		it('should return null when unable to register a new user', async () => {
			userService.createUser = jest.fn().mockResolvedValueOnce(null);

			const user = await authService.registerUser(userData);

			expect(user).toBeNull();
		});
	});

	describe('authenticateUser', () => {
		const userData: UserLoginDto = {
			email: 'test@mail.com',
			password: 'test_valid_password',
		};

		it('should return existed user if credentials is valid', async () => {
			userService.validateUser = jest.fn().mockImplementationOnce((dto: UserLoginDto): User => {
				return {
					id: 44,
					email: dto.email,
					name: 'existedUserName',
					password: 'hashed password',
					createdAt: new Date(),
					updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
					isActive: true,
				};
			});

			const authenticatedUser = await authService.authenticateUser(userData);

			expect(authenticatedUser).not.toBeNull();
			expect(authenticatedUser?.id).toEqual(44);
			expect(authenticatedUser?.password).not.toBe(userData.password);
		});

		it('should return null when credentials is not valid', async () => {
			userService.validateUser = jest.fn().mockResolvedValueOnce(null);

			const authenticatedUser = await authService.authenticateUser(userData);

			expect(authenticatedUser).toBeNull();
			expect(userService.validateUser).toHaveBeenCalledWith(userData);
		});
	});

	describe('signAccessToken', () => {
		const userPayload = {
			id: 1,
			email: 'test@email.com',
		};

		it('should sign new access jwt token (secret is not specified)', async () => {
			configService.get = jest.fn().mockReturnValueOnce('test-jwt-secret');

			const accessToken = await authService.signAccessToken(userPayload);

			expect(configService.get).toHaveBeenCalledWith(secrets.JWT_SECRET_KEY);
			expect(accessToken).not.toBeNull();
			expect(accessToken.length).toBeGreaterThan(0);
			expect(accessToken.split('.')).toHaveLength(3);
			expect(decode(accessToken)).toMatchObject<JwtPayload>({
				id: userPayload.id,
				email: userPayload.email,
			});
		});

		it('should sign new access jwt token (specified secret)', async () => {
			const SECRET_KEY = 'test-jwt-secret';

			const accessToken = await authService.signAccessToken(userPayload, SECRET_KEY);

			expect(accessToken).not.toBeNull();
			expect(accessToken.length).toBeGreaterThan(0);
			expect(accessToken.split('.')).toHaveLength(3);
			expect(decode(accessToken)).toMatchObject<JwtPayload>({
				id: userPayload.id,
				email: userPayload.email,
			});
		});
	});

	describe('signRefreshToken', () => {
		const userPayload = {
			id: 1,
			email: 'test@email.com',
		};

		it('should sign new refresh jwt token (secret is not specified)', async () => {
			configService.get = jest.fn().mockReturnValueOnce('test-refresh-jwt-secret');

			const accessToken = await authService.signRefreshToken(userPayload);

			expect(configService.get).toHaveBeenCalledWith(secrets.JWT_REFRESH_SECRET_KEY);
			expect(accessToken).not.toBeNull();
			expect(accessToken.length).toBeGreaterThan(0);
			expect(accessToken.split('.')).toHaveLength(3);
			expect(decode(accessToken)).toMatchObject<JwtPayload>({
				id: userPayload.id,
				email: userPayload.email,
			});
		});

		it('should sign new refresh jwt token (specified secret)', async () => {
			const REFRESH_SECRET_KEY = 'test-refresh-jwt-secret';

			const accessToken = await authService.signRefreshToken(userPayload, REFRESH_SECRET_KEY);

			expect(accessToken).not.toBeNull();
			expect(accessToken.length).toBeGreaterThan(0);
			expect(accessToken.split('.')).toHaveLength(3);
			expect(decode(accessToken)).toMatchObject<JwtPayload>({
				id: userPayload.id,
				email: userPayload.email,
			});
		});
	});

	describe('verifyAccessToken', () => {
		it('should return payload from access token if token is valid', async () => {
			const SECRET_KEY = 'test-jwt-secret';
			const payload = {
				id: 2,
				email: 'test@email.com',
			};
			configService.get = jest.fn().mockReturnValueOnce(SECRET_KEY);
			const getValidToken = (): Promise<string> =>
				new Promise<string>((resolve, reject) => {
					sign(
						{
							...payload,
							iat: Math.floor(Date.now() / 1000),
						},
						SECRET_KEY,
						{
							algorithm: 'HS256',
							expiresIn: '15m',
						},
						(error, encoded) => {
							if (encoded) {
								resolve(encoded);
							}
						},
					);
				});
			const validToken = await getValidToken();

			const verifiedPayload = await authService.verifyAccessToken(validToken);

			expect(verifiedPayload).not.toBeNull();
			expect(verifiedPayload).toMatchObject<JwtPayload>(payload);
			expect(getValidToken).not.toThrow();
			expect(configService.get).toHaveBeenCalledWith(secrets.JWT_SECRET_KEY);
		});

		it('should throw error when access token is not valid', async () => {
			configService.get = jest.fn().mockReturnValueOnce('test-jwt-secret');
			let error: JsonWebTokenError | null = null;
			const invalidToken = 'test-headers.test-payload.test-signature';

			const result = await authService
				.verifyAccessToken(invalidToken)
				.catch((err) => (error = err));

			expect(error).not.toBeNull();
			expect(error).toBeInstanceOf(JsonWebTokenError);
			expect(configService.get).toHaveBeenCalledWith(secrets.JWT_SECRET_KEY);
		});
	});

	describe('verifyRefreshToken', () => {
		it('should return payload from refresh token if token is valid', async () => {
			const payload = {
				id: 2,
				email: 'test@email.com',
			};
			const REFRESH_SECRET_KEY = 'test-refresh-jwt-secret';
			configService.get = jest.fn().mockReturnValueOnce(REFRESH_SECRET_KEY);
			const getValidRefreshToken = (): Promise<string> =>
				new Promise<string>((resolve, reject) => {
					sign(
						{
							...payload,
							iat: Math.floor(Date.now() / 1000),
						},
						REFRESH_SECRET_KEY,
						{
							algorithm: 'HS256',
							expiresIn: '7d',
						},
						(error, encoded) => {
							if (encoded) {
								resolve(encoded);
							}
						},
					);
				});
			const validRefreshToken = await getValidRefreshToken();

			const verifiedPayload = await authService.verifyRefreshToken(validRefreshToken);

			expect(verifiedPayload).not.toBeNull();
			expect(verifiedPayload).toMatchObject<JwtPayload>(payload);
			expect(getValidRefreshToken).not.toThrow();
			expect(configService.get).toHaveBeenCalledWith(secrets.JWT_REFRESH_SECRET_KEY);
		});

		it('should throw error when refresh token is not valid', async () => {
			configService.get = jest.fn().mockReturnValueOnce('test-refresh-jwt-secret');
			let error: JsonWebTokenError | null = null;
			const invalidRefreshToken = 'test-headers.test-payload.test-signature';

			const result = await authService
				.verifyRefreshToken(invalidRefreshToken)
				.catch((err) => (error = err));

			expect(error).not.toBeNull();
			expect(error).toBeInstanceOf(JsonWebTokenError);
			expect(configService.get).toHaveBeenCalledWith(secrets.JWT_REFRESH_SECRET_KEY);
		});
	});

	describe('saveAuthSession', () => {
		it('should save auth session with specified params', async () => {
			const userId = 1;
			const refreshToken = 'test_headers.test_payload.test_signature';
			const expiresAt = new Date();
			authRepository.saveAuthSession = jest
				.fn()
				.mockImplementationOnce((userId: number, token: string, expiresAt: Date): AuthSession => {
					return {
						id: 1,
						userId: userId,
						refreshToken: token,
						expiresAt: expiresAt,
						createdAt: new Date(),
						isRevoked: false,
						deviceInfo: null,
						ipAddress: null,
					};
				});

			const newAuthSession = await authService.saveAuthSession(userId, refreshToken, expiresAt);

			expect(newAuthSession.id).toBe(1);
			expect(newAuthSession.userId).toBe(userId);
			expect(newAuthSession.refreshToken).toBe(refreshToken);
			expect(newAuthSession.expiresAt).toBe(expiresAt);
		});
	});

	describe('updateAuthSession', () => {
		it('should update refresh token in auth session', async () => {
			const userId = 1;
			const refreshToken = 'test_headers.test_payload.test_signature';
			const oldRefreshToken = 'old_headers.old_payload.old_signature';
			const expiresAt = new Date();
			authRepository.updateAuthSession = jest
				.fn()
				.mockImplementationOnce(
					(userId: number, token: string, oldToken: string, expiresAt: Date): AuthSession => {
						return {
							id: 1,
							userId: userId,
							refreshToken: token,
							expiresAt: expiresAt,
							createdAt: new Date(),
							isRevoked: false,
							deviceInfo: null,
							ipAddress: null,
						};
					},
				);

			const authSession = await authService.updateAuthSession(
				userId,
				refreshToken,
				oldRefreshToken,
				expiresAt,
			);

			expect(authSession.refreshToken).not.toBe(oldRefreshToken);
			expect(authSession.refreshToken).toBe(refreshToken);
			expect(authSession.id).toBe(1);
			expect(authSession.userId).toBe(userId);
			expect(authSession.expiresAt).toBe(expiresAt);
		});
	});

	describe('deleteAuthSession', () => {
		it('should delete auth session with specified userId and token', async () => {
			const userId = 1;
			const refreshToken = 'test_headers.test_payload.test_signature';

			await authService.deleteAuthSession(userId, refreshToken);

			expect(authRepository.deleteAuthSession).toHaveBeenCalled();
			expect(authRepository.deleteAuthSession).toHaveBeenCalledWith(userId, refreshToken);
		});
	});

	describe('verifyStoredRefreshToken', () => {
		it(
			'should return true when the provided token matches ' +
				'the token stored in the auth session with the given userId',
			async () => {
				const userId = 1;
				const refreshToken = 'test_headers.test_payload.test_signature';
				authRepository.findAuthSession = jest
					.fn()
					.mockImplementationOnce((userId: number, refreshToken: string): AuthSession => {
						return {
							id: 1,
							userId: userId,
							refreshToken: refreshToken,
							expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
							createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
							isRevoked: false,
							deviceInfo: 'test-device-info',
							ipAddress: '212.198.23.77',
						};
					});

				const isValid = await authService.verifyStoredRefreshToken(userId, refreshToken);

				expect(authRepository.findAuthSession).toHaveBeenCalledWith(userId, refreshToken);
				expect(isValid).not.toBeFalsy();
			},
		);

		it(
			"should return false when the provided token doesn't matches " +
				'the token stored in the auth session with the given userId',
			async () => {
				const userId = 1;
				const refreshToken = 'test_headers.test_payload.test_signature';
				authRepository.findAuthSession = jest.fn().mockResolvedValueOnce(null);

				const isValid = await authService.verifyStoredRefreshToken(userId, refreshToken);

				expect(authRepository.findAuthSession).toHaveBeenCalledWith(userId, refreshToken);
				expect(isValid).toBeFalsy();
			},
		);
	});

	describe('generateVerificationToken', () => {
		it('should successfully generate a unique token on the first attempt', async () => {
			const userId = 1;
			const mockToken = 'generated-token';
			const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
			jest.spyOn(crypto as any, 'randomBytes').mockImplementationOnce(
				() =>
					({
						toString: () => mockToken,
					}) as any,
			);
			configService.get = jest.fn().mockReturnValueOnce('86400000'); // 24 часа
			authRepository.createVerificationToken = jest.fn().mockResolvedValueOnce({
				id: 1,
				userId,
				token: mockToken,
				createdAt: new Date(),
				expiresAt: expiryDate,
			});

			const result = await authService.generateVerificationToken(userId);

			expect(result).toBe(mockToken);
			expect(authRepository.createVerificationToken).toHaveBeenCalledWith(
				userId,
				mockToken,
				expect.any(Date),
			);
		});

		it('should retry on uniqueness errors and eventually create a token', async () => {
			const userId = 1;
			const mockToken1 = 'duplicate-token';
			const mockToken2 = 'unique-token';
			jest
				.spyOn(crypto as any, 'randomBytes')
				.mockImplementationOnce(() => ({ toString: () => mockToken1 }) as any)
				.mockImplementationOnce(() => ({ toString: () => mockToken2 }) as any);

			configService.get = jest.fn().mockReturnValue('86400000');

			authRepository.createVerificationToken = jest
				.fn()
				.mockImplementationOnce(() => {
					const error = new Error('Unique constraint failed') as PrismaClientKnownRequestError;
					error.code = 'P2002';
					return Promise.reject(error);
				})
				.mockResolvedValueOnce({
					id: 1,
					userId,
					token: mockToken2,
					createdAt: new Date(),
					expiresAt: new Date(),
				});

			const result = await authService.generateVerificationToken(userId);

			expect(result).toBe(mockToken2);
			expect(authRepository.createVerificationToken).toHaveBeenCalledTimes(2);
		});

		it('should throw an error after too many attempts', async () => {
			const userId = 1;
			jest.spyOn(crypto as any, 'randomBytes').mockImplementation(
				() =>
					({
						toString: () => 'always-same-token',
					}) as any,
			);
			configService.get = jest.fn().mockReturnValue('86400000');
			authRepository.createVerificationToken = jest.fn().mockImplementation(() => {
				const error = new Error('Unique constraint failed') as PrismaClientKnownRequestError;
				error.code = 'P2002';
				return Promise.reject(error);
			});

			await expect(authService.generateVerificationToken(userId)).rejects.toThrow();
		});
	});

	describe('verifyEmail', () => {
		it('should successfully verify email and activate the user', async () => {
			const userId = 1;
			const token = 'valid-token';
			authRepository.findVerificationToken = jest.fn().mockResolvedValueOnce({
				id: 1,
				userId: userId,
				token: token,
				createdAt: new Date(),
				expiresAt: new Date(Date.now() + 3600000),
			});
			userService.activateUser = jest.fn().mockResolvedValueOnce({
				id: userId,
				email: 'test@example.com',
				name: 'Test User',
				password: 'hashed_password',
				createdAt: new Date(),
				updatedAt: new Date(),
				isActive: true,
			});
			authRepository.deleteVerificationToken = jest.fn().mockResolvedValueOnce(undefined);

			const result = await authService.verifyEmail(userId, token);

			expect(result.id).toBe(userId);
			expect(result.isActive).toBe(true);
			expect(authRepository.findVerificationToken).toHaveBeenCalledWith(userId, token);
			expect(userService.activateUser).toHaveBeenCalledWith(userId);
			expect(authRepository.deleteVerificationToken).toHaveBeenCalledWith(userId, token);
		});

		it('should throw an error when token is invalid', async () => {
			const userId = 1;
			const token = 'invalid-token';
			authRepository.findVerificationToken = jest.fn().mockResolvedValueOnce(null);

			await expect(authService.verifyEmail(userId, token)).rejects.toThrow(AuthError);
		});

		it('should throw an error when token is expired', async () => {
			const userId = 1;
			const token = 'expired-token';
			authRepository.findVerificationToken = jest.fn().mockResolvedValueOnce({
				id: 1,
				userId: userId,
				token: token,
				createdAt: new Date(),
				expiresAt: new Date(Date.now() - 3600000),
			});

			await expect(authService.verifyEmail(userId, token)).rejects.toThrow(AuthError);
		});
	});

	describe('resendVerificationEmail', () => {
		it('should successfully resend verification email', async () => {
			const email = 'test@example.com';
			const userId = 1;
			const mockToken = 'new-verification-token';
			userService.getUser = jest.fn().mockResolvedValueOnce({
				id: userId,
				email: email,
				name: 'Test User',
				password: 'hashed_password',
				createdAt: new Date(),
				updatedAt: new Date(),
				isActive: false,
			});
			jest.spyOn(authService, 'generateVerificationToken').mockResolvedValueOnce(mockToken);
			jest.spyOn(authService as any, 'sendVerificationEmail').mockResolvedValueOnce(undefined);

			await authService.resendVerificationEmail(email);

			expect(userService.getUser).toHaveBeenCalledWith({ email });
			expect(authService.generateVerificationToken).toHaveBeenCalledWith(userId);
			expect((authService as any).sendVerificationEmail).toHaveBeenCalledWith(
				userId,
				email,
				mockToken,
			);
		});

		it('should throw error if user is not found', async () => {
			const email = 'nonexistent@example.com';
			userService.getUser = jest.fn().mockResolvedValueOnce(null);

			await expect(authService.resendVerificationEmail(email)).rejects.toThrow(AuthError);
			expect(userService.getUser).toHaveBeenCalledWith({ email });
		});

		it('should throw error if user is already activated and verified', async () => {
			const email = 'active@example.com';
			userService.getUser = jest.fn().mockResolvedValueOnce({
				id: 1,
				email: email,
				name: 'Active User',
				password: 'hashed_password',
				createdAt: new Date(),
				updatedAt: new Date(),
				isActive: true,
			});

			await expect(authService.resendVerificationEmail(email)).rejects.toThrow(AuthError);
			expect(userService.getUser).toHaveBeenCalledWith({ email });
		});
	});
});
