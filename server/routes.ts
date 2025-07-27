import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import * as path from "path";
import * as fs from "fs/promises";
import { storage } from "./storage";
import { insertClientSchema, insertInvoiceSchema, insertTemplateSchema } from "@shared/schema";
import { PDFService } from "./services/pdf-service";
import { EmailService } from "./services/email-service";
import { SchedulerService } from "./services/scheduler";

export async function registerRoutes(app: Express): Promise<Server> {
  const pdfService = new PDFService();
  const emailService = new EmailService();
  const schedulerService = new SchedulerService(storage, pdfService, emailService);

  // Multer configuration for file uploads
  const uploadStorage = multer.diskStorage({
    destination: async (req, file, cb) => {
      const uploadPath = path.join(process.cwd(), 'uploads', 'templates');
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({ 
    storage: uploadStorage,
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['.docx'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedTypes.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only DOCX files are allowed.'));
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  });

  // Client routes
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const client = await storage.getClientWithInvoices(req.params.id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      console.log('Client data received:', req.body);
      const validatedData = insertClientSchema.parse(req.body);
      console.log('Validated data:', validatedData);
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      console.error('Client validation error:', error);
      res.status(400).json({ 
        message: "Invalid client data", 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const validatedData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(req.params.id, validatedData);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(400).json({ message: "Invalid client data" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const success = await storage.deleteClient(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Invoice routes
  app.get("/api/invoices", async (req, res) => {
    try {
      const { status, startDate, endDate } = req.query;
      
      let invoices;
      if (status) {
        invoices = await storage.getInvoicesByStatus(status as string);
      } else if (startDate && endDate) {
        invoices = await storage.getInvoicesByDateRange(
          new Date(startDate as string),
          new Date(endDate as string)
        );
      } else {
        invoices = await storage.getInvoices();
      }
      
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoiceById(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      const validatedData = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(validatedData);
      
      // Generate DOCX invoice
      const docxPath = await pdfService.generateInvoicePDF(invoice.id);
      await storage.updateInvoice(invoice.id, { pdfPath: docxPath });
      
      // Log the generation
      await storage.createLogEntry({
        invoiceId: invoice.id,
        action: 'generated',
        status: 'success',
        details: 'Invoice PDF generated successfully',
      });

      res.status(201).json(invoice);
    } catch (error) {
      res.status(400).json({ message: "Failed to create invoice" });
    }
  });

  app.post("/api/invoices/:id/send", async (req, res) => {
    try {
      const invoice = await storage.getInvoiceById(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      if (!invoice.pdfPath) {
        const docxPath = await pdfService.generateInvoicePDF(invoice.id);
        await storage.updateInvoice(invoice.id, { pdfPath: docxPath });
      }

      const success = await emailService.sendInvoiceEmail(
        invoice.client,
        invoice.invoiceNumber,
        invoice.pdfPath
      );
      
      if (success) {
        await storage.updateInvoice(invoice.id, { 
          status: 'sent',
          emailSentAt: new Date()
        });
        await storage.createLogEntry({
          invoiceId: invoice.id,
          action: 'sent',
          status: 'success',
          details: 'Invoice email sent successfully',
        });
      } else {
        await storage.updateInvoice(invoice.id, { status: 'failed' });
        await storage.createLogEntry({
          invoiceId: invoice.id,
          action: 'sent',
          status: 'failed',
          details: 'Failed to send invoice email',
        });
      }

      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "Failed to send invoice" });
    }
  });

  app.post("/api/invoices/batch", async (req, res) => {
    try {
      const result = await schedulerService.runMonthlyBatch();
      res.json(result);
    } catch (error) {
      console.error('Batch process error:', error);
      res.status(500).json({ 
        message: "Failed to run batch process",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Template routes
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const validatedData = insertTemplateSchema.parse(req.body);
      const template = await storage.createTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      res.status(400).json({ message: "Invalid template data" });
    }
  });

  app.post("/api/templates/:id/activate", async (req, res) => {
    try {
      const success = await storage.setActiveTemplate(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to activate template" });
    }
  });

  // Template preview
  app.get("/api/templates/:id/preview", async (req, res) => {
    try {
      const template = await storage.getTemplateById(req.params.id);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      const filePath = path.join(process.cwd(), template.filePath.replace(/^\//, ''));
      
      try {
        // Check if file exists and read it
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const ext = path.extname(template.filePath).toLowerCase();
        
        if (ext === '.html' || ext === '.htm') {
          // For HTML files, return the content for preview
          res.json({ 
            content: fileContent,
            type: 'html'
          });
        } else {
          // For other files, just return metadata
          res.json({ 
            content: null,
            type: ext.replace('.', ''),
            message: `Preview not available for ${ext} files`
          });
        }
      } catch (fileError) {
        res.status(404).json({ 
          error: 'Template file not found',
          details: fileError.message 
        });
      }
    } catch (error: any) {
      console.error('Template preview error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Template file upload
  app.post("/api/templates/upload", upload.single('template'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { name, version = '1.0' } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Template name is required' });
      }

      const filePath = `/uploads/templates/${req.file.filename}`;
      
      // Create template record in database
      const template = await storage.createTemplate({
        name,
        filePath,
        version,
        isActive: 1
      });

      res.status(201).json({ 
        template,
        message: 'Template uploaded successfully'
      });
    } catch (error: any) {
      console.error('Template upload error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Log routes
  app.get("/api/logs", async (req, res) => {
    try {
      const { limit, invoiceId } = req.query;
      
      let logs;
      if (invoiceId) {
        logs = await storage.getLogEntriesForInvoice(invoiceId as string);
      } else {
        logs = await storage.getLogEntries(limit ? parseInt(limit as string) : undefined);
      }
      
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });

  // Statistics route
  app.get("/api/statistics", async (req, res) => {
    try {
      const stats = await storage.getStatistics();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
