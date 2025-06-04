import { config, configDotenv, DotenvConfigOutput, DotenvParseOutput } from 'dotenv';
import { inject } from 'inversify';
import { ILogger } from '../logger/logger.interface';
import { TYPES } from '../types';
import { IConfigService } from './config.service.interface';

export class ConfigService implements IConfigService {
	private readonly config: DotenvParseOutput;
	
	constructor(@inject(TYPES.ILogger) private logger: ILogger) {
		const result: DotenvConfigOutput = config();
		if (result.error) {
			this.logger.error('[ConfigService] failed to read .env or .env file doesn\'t exist')
			return;
		}
		
		this.logger.log('[ConfigService] configuration is loaded successfully')
		this.config = result.parsed as DotenvParseOutput;
	}
	
	get(key: string): string {
		return this.config[key];
	}
}
