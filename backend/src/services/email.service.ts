import nodemailer from 'nodemailer';
import { env } from '../config/env';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const fromAddress = process.env.SMTP_FROM || 'no-reply@example.com';

let transporter: any = null;
if (smtpHost && smtpPort && smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });
}

export const EmailService = {
  async sendMail(opts: { to: string; subject: string; html?: string; text?: string }) {
    if (!transporter) {
      console.log('Email fallback. To:', opts.to, 'Subject:', opts.subject);
      if (opts.html) console.log('HTML:', opts.html);
      if (opts.text) console.log('Text:', opts.text);
      return true;
    }

    const info = await transporter.sendMail({
      from: fromAddress,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });

    return info;
  },
};

export default EmailService;
