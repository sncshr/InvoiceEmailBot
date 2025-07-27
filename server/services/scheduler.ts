import cron from 'node-cron';
import { storage } from '../storage.js';
import { pdfService } from './pdf-service.js';
import { emailService } from './email-service.js';
import { docxService } from './docx-service.js';
import { nanoid } from 'nanoid';

export class SchedulerService {
  private isRunning = false;

  constructor(
    private storage: any,
    private pdfService: any,
    private emailService: any
  ) {
    this.setupMonthlyInvoiceGeneration();
  }

  private setupMonthlyInvoiceGeneration() {
    // Run on 1st of every month at 9:00 AM
    cron.schedule('0 9 1 * *', async () => {
      console.log('Starting monthly invoice generation...');
      await this.generateMonthlyInvoices();
    });

    console.log('Monthly invoice generation scheduled for 1st of every month at 9:00 AM');
  }

  async generateMonthlyInvoices(): Promise<void> {
    if (this.isRunning) {
      console.log('Monthly invoice generation already in progress');
      return;
    }

    this.isRunning = true;
    
    try {
      const clients = await this.storage.getClients();
      const currentDate = new Date();
      const monthYear = `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()}`;
      
      console.log(`Generating invoices for ${clients.length} clients for ${monthYear}`);

      for (const client of clients) {
        try {
          await this.generateClientInvoice(client, monthYear);
        } catch (error) {
          console.error(`Failed to generate invoice for client ${client.name}:`, error);
          
          // Log the error
          await this.storage.createLogEntry({
            action: 'failed',
            details: `Failed to generate invoice for ${client.name}: ${error}`,
            clientId: client.id
          });
        }
      }

      console.log('Monthly invoice generation completed');
      
      // Log successful completion
      await this.storage.createLogEntry({
        action: 'generated',
        details: `Generated invoices for ${clients.length} clients for ${monthYear}`
      });

    } catch (error) {
      console.error('Monthly invoice generation failed:', error);
      
      await this.storage.createLogEntry({
        action: 'failed',
        details: `Monthly generation failed: ${error}`
      });
    } finally {
      this.isRunning = false;
    }
  }

  private async generateClientInvoice(client: any, monthYear: string): Promise<void> {
    const invoiceNumber = await this.generateInvoiceNumber();
    const dated = new Date();

    // Create invoice record
    const invoice = await this.storage.createInvoice({
      invoiceNumber,
      dated,
      monthYear,
      clientId: client.id,
      status: 'pending'
    });

    // Generate DOCX invoice
    const docxPath = await docxService.generateInvoiceDocx(invoice.id, {
      invoiceNumber,
      dated: dated.toLocaleDateString('en-IN'),
      clientName: client.name,
      atSite: client.atSite,
      gstin: client.gstin || 'N/A',
      state: client.state,
      monthYear,
      serviceDescription: client.serviceDescription,
      hsnSacCode: client.hsnSacCode || '',
      rate: client.rate,
      cgst: client.cgst,
      sgst: client.sgst,
      igst: client.igst,
      totalTax: client.totalTax,
      totalAmountAfterTax: client.totalAmountAfterTax,
      amountInWords: client.amountInWords
    });

    // Update invoice with DOCX path
    await this.storage.updateInvoice(invoice.id, {
      pdfPath: docxPath,
      status: 'generated'
    });

    // Send email if client has email
    if (client.email) {
      const emailSent = await this.emailService.sendInvoiceEmail(
        client,
        invoiceNumber,
        docxPath
      );

      if (emailSent) {
        await this.storage.updateInvoice(invoice.id, {
          status: 'sent'
        });

        await this.storage.createLogEntry({
          action: 'sent',
          status: 'success',
          details: `Invoice ${invoiceNumber} sent to ${client.name}`,
          clientId: client.id,
          invoiceId: invoice.id
        });
      } else {
        await this.storage.createLogEntry({
          action: 'failed',
          status: 'failed',
          details: `Failed to send invoice ${invoiceNumber} to ${client.name}`,
          clientId: client.id,
          invoiceId: invoice.id
        });
      }
    }

    console.log(`Generated invoice ${invoiceNumber} for ${client.name}`);
  }

  private async generateInvoiceNumber(): Promise<string> {
    const currentDate = new Date();
    const year = currentDate.getFullYear().toString().slice(-2);
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    
    return `${year}${month}${random}`;
  }

  // Manual trigger for testing
  async triggerMonthlyGeneration(): Promise<void> {
    console.log('Manually triggering monthly invoice generation...');
    await this.generateMonthlyInvoices();
  }

  // API endpoint for batch processing
  async runMonthlyBatch(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    errors: string[];
  }> {
    const clients = await this.storage.getClients();
    const errors: string[] = [];
    let succeeded = 0;
    let failed = 0;

    const currentDate = new Date();
    const monthYear = `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()}`;
    
    console.log(`Running batch invoice generation for ${clients.length} clients`);

    for (const client of clients) {
      try {
        await this.generateClientInvoice(client, monthYear);
        succeeded++;
      } catch (error) {
        failed++;
        const errorMessage = `Failed to process client ${client.name}: ${error}`;
        errors.push(errorMessage);
        console.error(errorMessage);
      }
    }

    const result = {
      processed: clients.length,
      succeeded,
      failed,
      errors
    };

    console.log('Batch processing completed:', result);
    return result;
  }
}