import { injectable } from 'inversify';
import { Logger } from 'tslog';
import { ILogger } from './logger.interface.js';

@injectable()
export class LoggerService implements ILogger {
	public logger: Logger<any>;
	
	constructor() {
		this.logger = new Logger({
			hideLogPositionForProduction: true,
		});
	}
	
	log(...args: unknown[]) {
		this.logger.info(...args);
	}
	
	error(...args: unknown[]) {
		this.logger.error(...args);
	}
	
	warn(...args: unknown[]) {
		this.logger.warn(...args);
	}
}