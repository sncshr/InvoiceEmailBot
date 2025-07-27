import puppeteer from 'puppeteer';
import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs/promises';
import * as path from 'path';
import { storage } from '../storage';

export class PDFService {
  private async generateInvoiceHTML(invoiceId: string): Promise<string> {
    const invoice = await storage.getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Use a simple template replacement system
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 40px; 
          color: #333;
          line-height: 1.6;
        }
        .header { 
          text-align: center; 
          margin-bottom: 40px; 
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
        }
        .company-name {
          font-size: 28px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 10px;
        }
        .invoice-title {
          font-size: 24px;
          color: #374151;
          margin: 20px 0 10px 0;
        }
        .invoice-number {
          font-size: 18px;
          color: #6b7280;
        }
        .details-section {
          display: flex;
          justify-content: space-between;
          margin: 30px 0;
        }
        .bill-to, .invoice-details {
          width: 45%;
        }
        .section-title {
          font-size: 16px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 10px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 5px;
        }
        .amount-section {
          background-color: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          margin: 30px 0;
          text-align: center;
        }
        .amount-label {
          font-size: 18px;
          color: #374151;
          margin-bottom: 10px;
        }
        .amount-value {
          font-size: 36px;
          font-weight: bold;
          color: #059669;
        }
        .terms-section {
          margin-top: 30px;
          padding: 20px;
          background-color: #f9fafb;
          border-left: 4px solid #3b82f6;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
        }
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 100px;
          color: rgba(59, 130, 246, 0.05);
          z-index: -1;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="watermark">INVOICE</div>
      
      <div class="header">
        <div class="company-name">Your Business Name</div>
        <div style="color: #6b7280; margin-top: 5px;">Professional Services</div>
        <div class="invoice-title">INVOICE</div>
        <div class="invoice-number">Invoice #${invoice.invoiceNumber}</div>
      </div>

      <div class="details-section">
        <div class="bill-to">
          <div class="section-title">Bill To:</div>
          <div><strong>${invoice.client.name}</strong></div>
          <div>${invoice.client.email}</div>
          <div style="white-space: pre-line; margin-top: 10px;">${invoice.client.address}</div>
        </div>
        
        <div class="invoice-details">
          <div class="section-title">Invoice Details:</div>
          <div><strong>Issue Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</div>
          <div><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</div>
          <div><strong>Billing Period:</strong> ${invoice.period}</div>
          <div><strong>Payment Terms:</strong> Net 30</div>
        </div>
      </div>

      <div class="amount-section">
        <div class="amount-label">Total Amount Due</div>
        <div class="amount-value">${invoice.currency} ${invoice.amount}</div>
      </div>

      ${invoice.client.contractTerms ? `
      <div class="terms-section">
        <div class="section-title">Contract Terms & Notes:</div>
        <div style="white-space: pre-line;">${invoice.client.contractTerms}</div>
      </div>
      ` : ''}

      <div class="footer">
        <p>Thank you for your business!</p>
        <p>Please remit payment within 30 days of the invoice date.</p>
        <p>For questions regarding this invoice, please contact us at your-email@business.com</p>
      </div>
    </body>
    </html>
    `;

    return html;
  }

  async generateInvoicePDF(invoiceId: string): Promise<string> {
    try {
      const html = await this.generateInvoiceHTML(invoiceId);
      
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      });
      
      await browser.close();

      // Save PDF to file system
      const invoice = await storage.getInvoiceById(invoiceId);
      const fileName = `invoice-${invoice!.invoiceNumber}.pdf`;
      const filePath = path.join(process.cwd(), 'uploads', 'invoices', fileName);
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, pdfBuffer);

      return filePath;
    } catch (error) {
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  }

  async addWatermark(pdfPath: string): Promise<void> {
    try {
      const existingPdfBytes = await fs.readFile(pdfPath);
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      
      const pages = pdfDoc.getPages();
      
      pages.forEach(page => {
        const { width, height } = page.getSize();
        
        page.drawText('INVOICE', {
          x: width / 2 - 100,
          y: height / 2,
          size: 80,
          opacity: 0.1,
          rotate: { angle: -45 }
        });
      });

      const pdfBytes = await pdfDoc.save();
      await fs.writeFile(pdfPath, pdfBytes);
    } catch (error) {
      throw new Error(`Failed to add watermark: ${error.message}`);
    }
  }

  async generateInvoicePDF(invoiceId: string, data: any): Promise<string> {
    // Create directories if they don't exist
    const invoicesDir = path.join(process.cwd(), 'invoices');
    await fs.mkdir(invoicesDir, { recursive: true });

    // Generate HTML with GST template
    const html = await this.generateGSTInvoiceHTML(data);
    
    // Generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfPath = path.join(invoicesDir, `invoice-${invoiceId}.pdf`);
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true
    });
    
    await browser.close();
    return pdfPath;
  }

  private async generateGSTInvoiceHTML(data: any): Promise<string> {
    // Read the GST template
    const templatePath = path.join(process.cwd(), 'templates', 'gst-invoice-template.html');
    let html = await fs.readFile(templatePath, 'utf-8');

    // Replace placeholders with actual data
    html = html.replace(/\{\{invoiceNumber\}\}/g, data.invoiceNumber || '');
    html = html.replace(/\{\{dated\}\}/g, data.dated || '');
    html = html.replace(/\{\{clientName\}\}/g, data.clientName || '');
    html = html.replace(/\{\{atSite\}\}/g, data.atSite || '');
    html = html.replace(/\{\{gstin\}\}/g, data.gstin || 'N/A');
    html = html.replace(/\{\{state\}\}/g, data.state || '');
    html = html.replace(/\{\{monthYear\}\}/g, data.monthYear || '');
    html = html.replace(/\{\{serviceDescription\}\}/g, data.serviceDescription || '');
    html = html.replace(/\{\{hsnSacCode\}\}/g, data.hsnSacCode || '');
    html = html.replace(/\{\{rate\}\}/g, data.rate || '0.00');
    html = html.replace(/\{\{cgst\}\}/g, data.cgst || '0.00');
    html = html.replace(/\{\{sgst\}\}/g, data.sgst || '0.00');
    html = html.replace(/\{\{igst\}\}/g, data.igst || '0.00');
    html = html.replace(/\{\{totalTax\}\}/g, data.totalTax || '0.00');
    html = html.replace(/\{\{totalAmountAfterTax\}\}/g, data.totalAmountAfterTax || '0.00');
    html = html.replace(/\{\{amountInWords\}\}/g, data.amountInWords || '');

    return html;
  }
}

export const pdfService = new PDFService();
