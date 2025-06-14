import { AuthSession, VerificationToken } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { IPrismaService } from '../database/prisma.service.interface';
import { TYPES } from '../types';
import { IAuthRepository } from './auth.repository.interface';

@injectable()
export class AuthRepository implements IAuthRepository {
	constructor(@inject(TYPES.PrismaService) private prismaService: IPrismaService) {}

	public async saveAuthSession(
		userId: number,
		token: string,
		expiresAt: Date,
	): Promise<AuthSession> {
		return this.prismaService.client.authSession.create({
			data: {
				userId,
				refreshToken: token,
				expiresAt,
			},
		});
	}

	public async updateAuthSession(
		userId: number,
		token: string,
		oldToken: string,
		expiresAt: Date,
	): Promise<AuthSession> {
		return this.prismaService.client.authSession.update({
			data: {
				refreshToken: token,
				expiresAt,
			},
			where: {
				userId_refreshToken: {
					userId,
					refreshToken: oldToken,
				},
			},
		});
	}

	public async findAuthSession(userId: number, token: string): Promise<AuthSession | null> {
		return this.prismaService.client.authSession.findUnique({
			where: {
				userId_refreshToken: {
					userId,
					refreshToken: token,
				},
			},
		});
	}

	public async deleteAuthSession(userId: number, token: string): Promise<void> {
		await this.prismaService.client.authSession.delete({
			where: {
				userId_refreshToken: {
					userId: userId,
					refreshToken: token,
				},
			},
		});
	}

	public async createVerificationToken(
		userId: number,
		token: string,
		expiresAt: Date,
	): Promise<VerificationToken> {
		return this.prismaService.client.verificationToken.create({
			data: {
				userId,
				token,
				expiresAt,
			},
		});
	}

	public async deleteVerificationToken(userId: number, token: string): Promise<void> {
		await this.prismaService.client.verificationToken.delete({
			where: {
				userId_token: {
					userId,
					token,
				},
			},
		});
	}

	public async findVerificationToken(
		userId: number,
		token: string,
	): Promise<VerificationToken | null> {
		return this.prismaService.client.verificationToken.findUnique({
			where: {
				userId_token: {
					userId,
					token,
				},
			},
		});
	}
}
