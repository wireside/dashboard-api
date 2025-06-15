import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { configDotenv } from 'dotenv';

configDotenv();

const prisma = new PrismaClient();

async function main(): Promise<void> {
	await prisma.user.upsert({
		where: { email: 'aa@a.ru' },
		update: {},
		create: {
			email: 'aa@a.ru',
			password: await hash('sdfjgh22hjfQ@hd', Number(process.env.SALT)),
			name: 'Test User',
			isActive: true,
		},
	});
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
