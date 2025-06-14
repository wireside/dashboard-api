import { PrismaClient } from '@prisma/client';

export interface IPrismaService {
	get client(): PrismaClient;

	connect: () => Promise<void>;
	disconnect: () => Promise<void>;
}
