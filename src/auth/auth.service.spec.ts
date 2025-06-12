import { AuthSession, User } from '@prisma/client';
import { Container } from 'inversify';
import { decode, JsonWebTokenError, JwtPayload, sign } from 'jsonwebtoken';
import { IConfigService } from '../config/config.service.interface';
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

const ConfigServiceMock: IConfigService = {
	get: jest.fn(),
};

const AuthRepositoryMock: IAuthRepository = {
	saveAuthSession: jest.fn(),
	updateAuthSession: jest.fn(),
	findAuthSession: jest.fn(),
	deleteAuthSession: jest.fn(),
};

const UserServiceMock: IUserService = {
	createUser: jest.fn(),
	validateUser: jest.fn(),
	getUser: jest.fn(),
	getUserById: jest.fn(),
};

const container = new Container();
let configService: IConfigService;
let authRepository: IAuthRepository;
let userService: IUserService;
let authService: IAuthService;

beforeAll(() => {
	container.bind<IConfigService>(TYPES.ConfigService).toConstantValue(ConfigServiceMock);
	container.bind<IAuthRepository>(TYPES.AuthRepository).toConstantValue(AuthRepositoryMock);
	container.bind<IUserService>(TYPES.UserService).toConstantValue(UserServiceMock);
	container.bind<IAuthService>(TYPES.AuthService).to(AuthService);

	authService = container.get<IAuthService>(TYPES.AuthService);
	userService = container.get<IUserService>(TYPES.UserService);
	authRepository = container.get<IAuthRepository>(TYPES.AuthRepository);
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
});
