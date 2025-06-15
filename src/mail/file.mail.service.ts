import { inject, injectable } from 'inversify';
import fs from 'node:fs';
import path from 'node:path';
import { ILogger } from '../logger/logger.interface';
import { TYPES } from '../types';
import { IMailService } from './mail.service.interface';

@injectable()
export class FileMailService implements IMailService {
	private readonly mailDir: string;

	constructor(@inject(TYPES.ILogger) private logger: ILogger) {
		this.mailDir = path.resolve(process.cwd(), 'src', 'emails');

		if (!fs.existsSync(this.mailDir)) {
			fs.mkdirSync(this.mailDir, { recursive: true });
		}
	}

	public async sendEmail(from: string, to: string, subject: string, html: string): Promise<void> {
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		const fileName = `${timestamp}.txt`;
		const filePath = path.join(this.mailDir, fileName);

		const content = `From: ${from}
To: ${to}
Subject: ${subject}
Date: ${new Date().toISOString()}
Content-Type: text/html; charset=utf-8

${html}`;

		fs.writeFileSync(filePath, content);
	}
}
