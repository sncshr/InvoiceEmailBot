import nodemailer from 'nodemailer';
import { storage } from '../storage';
import { emailConfigService } from './email-config-service';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private lastConfig: any = null;

  async initializeTransporter(config?: any): Promise<boolean> {
    try {
      // Use config if provided, otherwise get from DB
      let settings = config;
      if (!settings) {
        settings = await emailConfigService.getActiveEmailSettings();
      }
      if (!settings) throw new Error('No email settings configured');
      this.lastConfig = settings;
      this.transporter = nodemailer.createTransport({
        host: settings.smtpHost,
        port: settings.smtpPort,
        secure: !!settings.smtpSecure,
        auth: settings.smtpUser && settings.smtpPassword ? {
          user: settings.smtpUser,
          pass: settings.smtpPassword
        } : undefined
      });
      return true;
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
      return false;
    }
  }

  async sendInvoiceEmail(
    client: any,
    invoiceNumber: string,
    attachmentPath: string
  ): Promise<boolean> {
    try {
      if (!client.email) {
        console.log(`No email address for client ${client.name}, skipping email`);
        return true;
      }
      // Use per-client sender or global
      let settings = await emailConfigService.getActiveEmailSettings();
      let fromEmail = client.customSenderEmail || settings?.fromEmail;
      let fromName = client.customSenderName || settings?.fromName;
      let replyTo = settings?.replyTo;
      // Use per-client email body or default
      let html = client.customEmailBody || `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">GST Tax Invoice</h2>
          <p>Dear ${client.name},</p>
          <p>Please find attached your GST tax invoice for the services provided.</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Invoice Details:</strong><br>
            Invoice Number: ${invoiceNumber}<br>
            Company: ${fromName}<br>
            GSTIN: ${client.gstin || 'N/A'}
          </div>
          <p>Thank you for your business!</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">
            This is an automated email. Please do not reply to this email address.
          </p>
        </div>
      `;
      const subject = `GST Invoice ${invoiceNumber} - ${fromName}`;
      if (!this.transporter || !this.lastConfig || this.lastConfig.smtpHost !== settings?.smtpHost) {
        await this.initializeTransporter(settings);
      }
      if (!this.transporter) {
        console.warn('Email transporter not available');
        return false;
      }
      // For testing, just log
      console.log(`\n=== EMAIL SIMULATION ===`);
      console.log(`To: ${client.email}`);
      console.log(`From: ${fromName} <${fromEmail}>`);
      console.log(`Subject: ${subject}`);
      console.log(`Invoice: ${invoiceNumber} for ${client.name}`);
      console.log(`Attachment: ${attachmentPath}`);
      console.log(`=========================\n`);
      // Uncomment to actually send
      // await this.transporter.sendMail({
      //   from: `${fromName} <${fromEmail}>`,
      //   to: client.email,
      //   subject,
      //   html,
      //   replyTo,
      //   attachments: attachmentPath ? [{ filename: `Invoice_${invoiceNumber}.pdf`, path: attachmentPath }] : undefined
      // });
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();