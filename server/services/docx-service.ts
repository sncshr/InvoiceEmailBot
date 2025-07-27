import * as fs from 'fs/promises';
import * as path from 'path';

export interface DocxTemplateData {
  invoiceNumber: string;
  dated: string;
  clientName: string;
  atSite: string;
  gstin: string;
  state: string;
  monthYear: string;
  serviceDescription: string;
  hsnSacCode?: string;
  rate: string;
  cgst: string;
  sgst: string;
  igst: string;
  totalTax: string;
  totalAmountAfterTax: string;
  amountInWords: string;
}

export class DocxService {
  async processTemplate(templatePath: string, data: DocxTemplateData, outputPath: string): Promise<string> {
    try {
      // For now, we'll copy the template and replace placeholders
      // In a production environment, you'd use a library like docxtemplater
      const templateBuffer = await fs.readFile(templatePath);
      
      // Create output directory if it doesn't exist
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });
      
      // For now, just copy the template as-is
      // In production, you would use docxtemplater to replace placeholders
      await fs.writeFile(outputPath, templateBuffer);
      
      console.log(`DOCX template processed: ${outputPath}`);
      console.log('Template data:', data);
      
      return outputPath;
    } catch (error) {
      throw new Error(`Failed to process DOCX template: ${error}`);
    }
  }

  async generateInvoiceDocx(invoiceId: string, data: DocxTemplateData): Promise<string> {
    const templatePath = path.join(process.cwd(), 'templates', 'default-gst-template.docx');
    const outputDir = path.join(process.cwd(), 'invoices');
    const outputPath = path.join(outputDir, `invoice-${invoiceId}.docx`);
    
    return this.processTemplate(templatePath, data, outputPath);
  }
}

export const docxService = new DocxService();