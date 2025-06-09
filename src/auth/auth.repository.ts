import { AuthSession } from "@prisma/client";
import { inject, injectable } from "inversify";
import { IPrismaService } from "../database/prisma.service.interface";
import { TYPES } from "../types";
import { IAuthRepository } from "./auth.repository.interface";

@injectable()
export class AuthRepository implements IAuthRepository {
  constructor(
    @inject(TYPES.PrismaService) private prismaService: IPrismaService,
  ) {}

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
    expiresAt: Date,
    oldToken: string,
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

  public async findAuthSession(
    userId: number,
    token: string,
  ): Promise<AuthSession | null> {
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
}
