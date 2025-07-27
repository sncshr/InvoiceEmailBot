import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    path: string;
  }>;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure SMTP transporter
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASSWORD || ''
      }
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_USER || 'noreply@indoessarr.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments
      });

      console.log('Email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendInvoiceEmail(
    clientEmail: string,
    clientName: string,
    invoiceNumber: string,
    pdfPath: string
  ): Promise<boolean> {
    const subject = `GST Tax Invoice ${invoiceNumber} - ${clientName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">GST Tax Invoice - ${invoiceNumber}</h2>
        
        <p>Dear ${clientName},</p>
        
        <p>Please find attached your GST tax invoice for the current billing period.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Invoice Details:</h3>
          <p style="margin: 5px 0;"><strong>Invoice Number:</strong> ${invoiceNumber}</p>
          <p style="margin: 5px 0;"><strong>Client:</strong> ${clientName}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
        </div>
        
        <p>Thank you for your business. Please process the payment as per the terms mentioned in the invoice.</p>
        
        <p>For any queries regarding this invoice, please contact us.</p>
        
        <p>Best regards,<br>
        <strong>INDOESSARR ENGINEERS & ASSOCIATES</strong><br>
        1ST floor Old LIC Building, Opp. M.C. Office<br>
        GSTIN: 02ACFPS5258K2ZC</p>
      </div>
    `;

    return this.sendEmail({
      to: clientEmail,
      subject,
      html,
      attachments: [{
        filename: `Invoice_${invoiceNumber}.pdf`,
        path: pdfPath
      }]
    });
  }
}

export const emailService = new EmailService();