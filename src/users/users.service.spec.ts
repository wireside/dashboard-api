import { Prisma, User } from '@prisma/client';
import { Container } from 'inversify';
import { IConfigService } from '../config/config.service.interface';
import { TYPES } from '../types';
import { UserSignupDto } from './dto/user-signup.dto';
import { UserEntity } from './user.entity';
import { IUserRepository } from './users.repository.interface';
import { UserService } from './users.service';
import { IUserService } from './users.service.interface';

const ConfigServiceMock: IConfigService = {
	get: jest.fn(),
};

const UserRepositoryMock: IUserRepository = {
	find: jest.fn(),
	findById: jest.fn(),
	create: jest.fn(),
	update: jest.fn(),
};

const container = new Container();
let configService: IConfigService;
let userRepository: IUserRepository;
let userService: IUserService;

beforeAll(() => {
	container.bind<IUserService>(TYPES.UserService).to(UserService);
	container.bind<IConfigService>(TYPES.ConfigService).toConstantValue(ConfigServiceMock);
	container.bind<IUserRepository>(TYPES.UserRepository).toConstantValue(UserRepositoryMock);

	configService = container.get<IConfigService>(TYPES.ConfigService);
	userRepository = container.get<IUserRepository>(TYPES.UserRepository);
	userService = container.get<IUserService>(TYPES.UserService);
});

beforeEach(() => {
	jest.clearAllMocks();
});

describe('User Service', () => {
	describe('createUser', () => {
		const userData: UserSignupDto = {
			email: 'test@email.com',
			name: 'John',
			password: 'test-password',
		};

		it('should create a new user when email is not taken', async () => {
			configService.get = jest.fn().mockReturnValueOnce('10');
			userRepository.find = jest.fn().mockResolvedValueOnce(null); // user with specified email doesn't exist
			userRepository.create = jest.fn().mockImplementationOnce((user: UserEntity): User => {
				return {
					id: 1,
					email: user.email,
					name: user.name,
					password: user.password,
					createdAt: new Date(),
					updatedAt: new Date(Date.now() - 1),
					isActive: false,
				};
			});

			const createdUser = await userService.createUser(userData);

			expect(createdUser?.id).toEqual(1);
			expect(createdUser?.password).not.toEqual('test-password');
		});

		it('should return null when email is taken', async () => {
			configService.get = jest.fn().mockReturnValueOnce('10');
			userRepository.find = jest
				.fn()
				.mockImplementationOnce((where: Prisma.UserWhereUniqueInput): User => {
					return {
						id: 1,
						email: where.email as string,
						name: userData.name,
						password: 'hashedPassword',
						createdAt: new Date(),
						updatedAt: new Date(Date.now() - 1),
						isActive: false,
					};
				});

			const createdUser = await userService.createUser(userData);

			expect(createdUser).toEqual(null);
			expect(userRepository.create).not.toHaveBeenCalled();
		});
	});

	describe('validateUser', () => {
		const userData = {
			email: 'test@mail.com',
			password: 'test-password',
		};

		it('should return user with valid credentials', async () => {
			userRepository.find = jest
				.fn()
				.mockImplementationOnce((where: Prisma.UserWhereUniqueInput): User => {
					return {
						id: 1,
						email: where.email as string,
						name: 'test-name',
						password: 'hashedPassword',
						createdAt: new Date(),
						updatedAt: new Date(Date.now() - 1),
						isActive: true,
					};
				});
			const comparePassword = jest
				.spyOn(UserEntity.prototype, 'comparePassword')
				.mockResolvedValueOnce(true);

			const authenticatedUser = await userService.validateUser(userData);

			expect(userRepository.find).toHaveBeenCalledWith({
				email: userData.email,
			});
			expect(comparePassword).toHaveBeenCalledWith(userData.password);
			expect(authenticatedUser).not.toBeNull();
			expect(authenticatedUser?.email).toEqual(userData.email);
		});

		it("should return null when user doesn't exist", async () => {
			userRepository.find = jest.fn().mockResolvedValueOnce(null);
			const comparePassword = jest.spyOn(UserEntity.prototype, 'comparePassword');

			const authenticatedUser = await userService.validateUser(userData);

			expect(authenticatedUser).toEqual(null);
			expect(comparePassword).not.toHaveBeenCalled();
		});

		it('should return null when password is not valid', async () => {
			const invalidPasswordUserData = {
				...userData,
				password: 'wrong-password',
			};
			userRepository.find = jest
				.fn()
				.mockImplementationOnce((where: Prisma.UserWhereUniqueInput): User => {
					return {
						id: 1,
						email: where.email as string,
						name: 'test-name',
						password: 'hashedPassword',
						createdAt: new Date(),
						updatedAt: new Date(Date.now() - 1),
						isActive: true,
					};
				});
			const comparePassword = jest
				.spyOn(UserEntity.prototype, 'comparePassword')
				.mockResolvedValueOnce(false);

			const authenticatedUser = await userService.validateUser(invalidPasswordUserData);

			expect(userRepository.find).toHaveBeenCalledWith({
				email: invalidPasswordUserData.email,
			});
			expect(comparePassword).toHaveBeenCalledWith(invalidPasswordUserData.password);
			expect(authenticatedUser).toEqual(null);
		});
	});

	describe('getUser', () => {
		const userWhereInput = {
			email: 'test@email.com',
		};

		it('should return user if found', async () => {
			userRepository.find = jest
				.fn()
				.mockImplementationOnce((where: Prisma.UserWhereUniqueInput): User => {
					return {
						id: 1,
						email: where.email as string,
						name: 'test-name',
						password: 'hashedPassword',
						createdAt: new Date(),
						updatedAt: new Date(Date.now() - 1),
						isActive: true,
					};
				});

			const user = await userService.getUser(userWhereInput);

			expect(userRepository.find).toHaveBeenCalledWith(userWhereInput);
			expect(user).not.toBeNull();
			expect(user?.id).toEqual(1);
			expect(user?.email).toEqual(userWhereInput.email);
		});

		it("should return null if user doesn't exist", async () => {
			userRepository.find = jest.fn().mockResolvedValueOnce(null);

			const user = await userService.getUser(userWhereInput);

			expect(user).toEqual(null);
			expect(userRepository.find).toHaveBeenCalledWith(userWhereInput);
		});
	});

	describe('getUserById', () => {
		const userId = 1;

		it('should return user by id when user exists', async () => {
			userRepository.findById = jest.fn().mockImplementationOnce((id: number) => {
				return {
					id: id,
					email: 'test@email.com',
					name: 'test-name',
					password: 'hashedPassword',
					createdAt: new Date(),
					updatedAt: new Date(Date.now() - 1),
				};
			});

			const user = await userService.getUserById(userId);

			expect(userRepository.findById).toHaveBeenCalledWith(userId);
			expect(user).not.toBeNull();
			expect(user?.id).toEqual(userId);
		});

		it('should return null when user is not found', async () => {
			userRepository.findById = jest.fn().mockResolvedValueOnce(null);

			const user = await userService.getUserById(userId);

			expect(userRepository.findById).toHaveBeenCalledWith(userId);
			expect(user).toEqual(null);
		});
	});
});
