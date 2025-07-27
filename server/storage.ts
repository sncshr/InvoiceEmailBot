import { 
  clients, 
  invoices, 
  templates, 
  logEntries,
  emailSettings,
  type Client,
  type InsertClient,
  type Invoice,
  type InsertInvoice,
  type Template,
  type InsertTemplate,
  type LogEntry,
  type InsertLogEntry,
  type EmailSettings,
  type InsertEmailSettings,
  type ClientWithInvoices,
  type InvoiceWithClient
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, count } from "drizzle-orm";

export interface IStorage {
  // Client operations
  getClients(): Promise<Client[]>;
  getClientById(id: string): Promise<Client | undefined>;
  getClientWithInvoices(id: string): Promise<ClientWithInvoices | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;

  // Invoice operations
  getInvoices(): Promise<InvoiceWithClient[]>;
  getInvoiceById(id: string): Promise<InvoiceWithClient | undefined>;
  getInvoicesByStatus(status: string): Promise<InvoiceWithClient[]>;
  getInvoicesByDateRange(startDate: Date, endDate: Date): Promise<InvoiceWithClient[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  getNextInvoiceNumber(): Promise<string>;

  // Template operations
  getTemplates(): Promise<Template[]>;
  getTemplateById(id: string): Promise<Template | undefined>;
  getActiveTemplate(): Promise<Template | undefined>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  setActiveTemplate(id: string): Promise<boolean>;

  // Log operations
  getLogEntries(limit?: number): Promise<LogEntry[]>;
  getLogEntriesForInvoice(invoiceId: string): Promise<LogEntry[]>;
  createLogEntry(logEntry: InsertLogEntry): Promise<LogEntry>;

  // Email settings operations
  getEmailSettings(): Promise<EmailSettings[]>;
  getActiveEmailSettings(): Promise<EmailSettings | undefined>;
  createEmailSettings(settings: InsertEmailSettings): Promise<EmailSettings>;
  updateEmailSettings(id: string, settings: Partial<InsertEmailSettings>): Promise<EmailSettings | undefined>;

  // Statistics
  getStatistics(): Promise<{
    totalClients: number;
    pendingInvoices: number;
    sentThisMonth: number;
    failedDeliveries: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(clients.name);
  }

  async getClientById(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async getClientWithInvoices(id: string): Promise<ClientWithInvoices | undefined> {
    const result = await db.query.clients.findFirst({
      where: eq(clients.id, id),
      with: {
        invoices: {
          orderBy: desc(invoices.createdAt),
        },
      },
    });
    return result || undefined;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db
      .insert(clients)
      .values({
        ...insertClient,
        updatedAt: new Date(),
      })
      .returning();
    return client;
  }

  async updateClient(id: string, updateClient: Partial<InsertClient>): Promise<Client | undefined> {
    const [client] = await db
      .update(clients)
      .set({
        ...updateClient,
        updatedAt: new Date(),
      })
      .where(eq(clients.id, id))
      .returning();
    return client || undefined;
  }

  async deleteClient(id: string): Promise<boolean> {
    const result = await db.delete(clients).where(eq(clients.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getInvoices(): Promise<InvoiceWithClient[]> {
    return await db.query.invoices.findMany({
      with: {
        client: true,
      },
      orderBy: desc(invoices.createdAt),
    });
  }

  async getInvoiceById(id: string): Promise<InvoiceWithClient | undefined> {
    const result = await db.query.invoices.findFirst({
      where: eq(invoices.id, id),
      with: {
        client: true,
      },
    });
    return result || undefined;
  }

  async getInvoicesByStatus(status: string): Promise<InvoiceWithClient[]> {
    return await db.query.invoices.findMany({
      where: eq(invoices.status, status as any),
      with: {
        client: true,
      },
      orderBy: desc(invoices.createdAt),
    });
  }

  async getInvoicesByDateRange(startDate: Date, endDate: Date): Promise<InvoiceWithClient[]> {
    return await db.query.invoices.findMany({
      where: and(
        gte(invoices.dated, startDate),
        lte(invoices.dated, endDate)
      ),
      with: {
        client: true,
      },
      orderBy: desc(invoices.createdAt),
    });
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const invoiceNumber = await this.getNextInvoiceNumber();
    const [invoice] = await db
      .insert(invoices)
      .values({
        ...insertInvoice,
        invoiceNumber,
        updatedAt: new Date(),
      })
      .returning();
    return invoice;
  }

  async updateInvoice(id: string, updateInvoice: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [invoice] = await db
      .update(invoices)
      .set({
        ...updateInvoice,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, id))
      .returning();
    return invoice || undefined;
  }

  async getNextInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const [lastInvoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.invoiceNumber, `${year}-%`))
      .orderBy(desc(invoices.invoiceNumber))
      .limit(1);

    if (!lastInvoice) {
      return `${year}-001`;
    }

    const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[1]) || 0;
    const nextNumber = (lastNumber + 1).toString().padStart(3, '0');
    return `${year}-${nextNumber}`;
  }

  async getTemplates(): Promise<Template[]> {
    return await db.select().from(templates).orderBy(desc(templates.createdAt));
  }

  async getTemplateById(id: string): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template || undefined;
  }

  async getActiveTemplate(): Promise<Template | undefined> {
    const [template] = await db
      .select()
      .from(templates)
      .where(eq(templates.isActive, 1))
      .limit(1);
    return template || undefined;
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const [template] = await db
      .insert(templates)
      .values(insertTemplate)
      .returning();
    return template;
  }

  async setActiveTemplate(id: string): Promise<boolean> {
    await db.update(templates).set({ isActive: 0 });
    const result = await db
      .update(templates)
      .set({ isActive: 1 })
      .where(eq(templates.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getLogEntries(limit: number = 50): Promise<LogEntry[]> {
    return await db
      .select()
      .from(logEntries)
      .orderBy(desc(logEntries.timestamp))
      .limit(limit);
  }

  async getLogEntriesForInvoice(invoiceId: string): Promise<LogEntry[]> {
    return await db
      .select()
      .from(logEntries)
      .where(eq(logEntries.invoiceId, invoiceId))
      .orderBy(desc(logEntries.timestamp));
  }

  async createLogEntry(insertLogEntry: InsertLogEntry): Promise<LogEntry> {
    const [logEntry] = await db
      .insert(logEntries)
      .values(insertLogEntry)
      .returning();
    return logEntry;
  }

  async getStatistics(): Promise<{
    totalClients: number;
    pendingInvoices: number;
    sentThisMonth: number;
    failedDeliveries: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [totalClientsResult] = await db.select({ count: count() }).from(clients);
    const [pendingInvoicesResult] = await db
      .select({ count: count() })
      .from(invoices)
      .where(eq(invoices.status, 'pending'));
    const [sentThisMonthResult] = await db
      .select({ count: count() })
      .from(invoices)
      .where(
        and(
          eq(invoices.status, 'sent'),
          gte(invoices.dated, startOfMonth),
          lte(invoices.dated, endOfMonth)
        )
      );
    const [failedDeliveriesResult] = await db
      .select({ count: count() })
      .from(invoices)
      .where(eq(invoices.status, 'failed'));

    return {
      totalClients: totalClientsResult.count,
      pendingInvoices: pendingInvoicesResult.count,
      sentThisMonth: sentThisMonthResult.count,
      failedDeliveries: failedDeliveriesResult.count,
    };
  }

  // Email settings methods
  async getEmailSettings(): Promise<EmailSettings[]> {
    return await db.select().from(emailSettings);
  }

  async getActiveEmailSettings(): Promise<EmailSettings | undefined> {
    const [settings] = await db
      .select()
      .from(emailSettings)
      .where(eq(emailSettings.isActive, 1))
      .limit(1);
    return settings || undefined;
  }

  async createEmailSettings(insertSettings: InsertEmailSettings): Promise<EmailSettings> {
    const [settings] = await db
      .insert(emailSettings)
      .values({
        ...insertSettings,
        updatedAt: new Date(),
      })
      .returning();
    return settings;
  }

  async updateEmailSettings(id: string, updateSettings: Partial<InsertEmailSettings>): Promise<EmailSettings | undefined> {
    const [settings] = await db
      .update(emailSettings)
      .set({
        ...updateSettings,
        updatedAt: new Date(),
      })
      .where(eq(emailSettings.id, id))
      .returning();
    return settings || undefined;
  }
}

export const storage = new DatabaseStorage();
