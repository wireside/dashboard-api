import request from 'supertest';
import { App } from '../app';
import { boot } from '../main';

let application: App;

beforeAll(async () => {
	const { app } = await boot;
	application = app;
});

describe('Users e2e', () => {
	const existedUserData = {
		email: 'aa@a.ru',
		password: 'sdfjgh22hjfQ@hd',
	};

	it('Info - success', async () => {
		const loginRes = await request(application.app).post('/auth/login').send(existedUserData);
		const { accessToken } = loginRes.body.data.auth;

		const res = await request(application.app)
			.get('/users/info')
			.set({
				authorization: `Bearer ${accessToken}`,
			});

		expect(res.statusCode).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.error).not.toBeDefined();
		expect(res.body.data).toBeDefined();
		expect(res.body.data.user.email).toBe(existedUserData.email);
	});

	it('Info - error', async () => {
		const loginRes = await request(application.app).post('/auth/login').send(existedUserData);
		const invalidAccessToken = 'test-headers.test-payload.test-signature';

		const res = await request(application.app)
			.get('/users/info')
			.set({
				authorization: `Bearer ${invalidAccessToken}`,
			});

		expect(res.statusCode).toBe(401);
		expect(res.body.data).not.toBeDefined();
		expect(res.body.error).toBeDefined();
		expect(res.body.error.errors).toBeDefined();
		expect(res.body.error.errors[0].context).toBe('auth');
	});
});

afterAll(() => {
	application.close();
});
