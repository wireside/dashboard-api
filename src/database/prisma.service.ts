import { PrismaClient } from "@prisma/client";
import { inject, injectable } from "inversify";
import { ILogger } from "../logger/logger.interface";
import { TYPES } from "../types";
import { IPrismaService } from "./prisma.service.interface";

@injectable()
export class PrismaService implements IPrismaService {
  private readonly _client: PrismaClient;

  constructor(@inject(TYPES.ILogger) private logger: ILogger) {
    this._client = new PrismaClient();
  }

  get client(): PrismaClient {
    return this._client;
  }

  async connect(): Promise<void> {
    try {
      await this.client.$connect();
      this.logger.log("[PrismaService] successfully connected to the database");
    } catch (e) {
      if (e instanceof Error) {
        this.logger.error(
          "[PrismaService] database connection failed: " + e.message,
        );
      }
    }
  }

  async disconnect(): Promise<void> {
    await this.client.$disconnect();
  }
}
