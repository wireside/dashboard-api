import { faker } from '@faker-js/faker';
import request from 'supertest';
import { App } from '../app';
import { boot } from '../main';

let application: App;

beforeAll(async () => {
	const { app, appContainer } = await boot;
	application = app;
});

describe('Auth e2e', () => {
	const existedUserData = {
		email: 'aa@a.ru',
		password: 'sdfjgh22hjfQ@hd',
	};

	it('Signup - success', async () => {
		const userData = {
			email: faker.internet.email(),
			password: faker.internet.password(),
			name: faker.person.firstName(),
		}
		
		const res = await request(application.app).post('/auth/signup').send(userData);
		
		expect(res.statusCode).toBe(201);
		expect(res.body.success).toBe(true);
		expect(res.body.data.user).toBeDefined();
		expect(res.body.data.user.email).toBe(userData.email);
		expect(res.body.data.user.name).toBe(userData.name);
		expect(res.body.data.user.message).toContain(`Verification email sent to ${userData.email}`);
	});

	it('Signup - error', async () => {
		const res = await request(application.app)
			.post('/auth/signup')
			.send({
				...existedUserData,
				name: 'someName',
			});

		expect(res.statusCode).toBe(422);
		expect(res.body.success).toBe(false);
		expect(res.body.error).toBeDefined();
	});

	it('Login - success', async () => {
		const res = await request(application.app).post('/auth/login').send(existedUserData);

		expect(res.statusCode).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.error).not.toBeDefined();
		expect(res.body.data).toBeDefined();
		expect(res.body.data.auth.accessToken).toBeDefined();
		expect(res.headers['set-cookie'][0]).toContain('refreshToken=');
	});

	it('Login - error', async () => {
		const res = await request(application.app).post('/auth/login').send({
			email: existedUserData.email,
			password: 'wrong-password',
		});

		expect(res.statusCode).toBe(401);
		expect(res.body.success).toBe(false);
		expect(res.body.data).not.toBeDefined();
		expect(res.body.error).toBeDefined();
		expect(res.body.error.errors).toBeDefined();
		expect(res.body.error.errors).toHaveLength(1);
	});
});

afterAll(() => {
	application.close();
});
