import { inject, injectable } from 'inversify';
import nodemailer, { Transporter } from 'nodemailer';
import { IConfigService } from '../config/config.service.interface';
import { TYPES } from '../types';
import { IMailService } from './mail.service.interface';
@injectable()
export class MailService implements IMailService {
	private transporter: Transporter;

	constructor(@inject(TYPES.ConfigService) private configService: IConfigService) {
		this.transporter = nodemailer.createTransport({
			host: this.configService.get('MAIL_HOST'),
			port: Number(this.configService.get('MAIL_PORT')),
			auth: {
				user: this.configService.get('MAIL_USERNAME'),
				pass: this.configService.get('MAIL_PASSWORD'),
			},
		});
	}

	public async sendEmail(from: string, to: string, subject: string, html: string): Promise<void> {
		return this.transporter.sendMail({
			from,
			to,
			subject,
			html,
		});
	}
}
