"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const fromAddress = process.env.SMTP_FROM || 'no-reply@example.com';
let transporter = null;
if (smtpHost && smtpPort && smtpUser && smtpPass) {
    transporter = nodemailer_1.default.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
    });
}
exports.EmailService = {
    async sendMail(opts) {
        if (!transporter) {
            console.log('Email fallback. To:', opts.to, 'Subject:', opts.subject);
            if (opts.html)
                console.log('HTML:', opts.html);
            if (opts.text)
                console.log('Text:', opts.text);
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
exports.default = exports.EmailService;
