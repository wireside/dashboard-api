export interface IMailService {
	sendEmail: (from: string, to: string, subject: string, html: string) => Promise<void>;
}
