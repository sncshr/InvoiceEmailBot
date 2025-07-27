import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer, pgEnum, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const invoiceStatus = pgEnum('invoice_status', ['pending', 'generated', 'sent', 'failed']);
export const logAction = pgEnum('log_action', ['generated', 'sent', 'failed', 'retried', 'monthly_generation_error', 'monthly_generation_completed', 'monthly_generation_failed', 'invoice_sent', 'email_failed']);

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // Client business name
  email: text("email"), // Client email for invoice delivery
  atSite: text("at_site").notNull(), // At Site field (branch/location)
  gstin: text("gstin"), // Client GSTIN number
  state: text("state").notNull(), // Client state
  serviceDescription: text("service_description").notNull(), // e.g., "D G SET RENT (INSTALLED IN BANK)"
  hsnSacCode: text("hsn_sac_code"), // HSN/SAC code
  // Pre-calculated amounts in INR
  rate: decimal("rate", { precision: 10, scale: 2 }).notNull(), // Base rate
  cgst: decimal("cgst", { precision: 10, scale: 2 }).notNull(), // CGST amount
  sgst: decimal("sgst", { precision: 10, scale: 2 }).notNull(), // SGST amount
  igst: decimal("igst", { precision: 10, scale: 2 }).notNull().default('0.00'), // IGST amount
  totalTax: decimal("total_tax", { precision: 10, scale: 2 }).notNull(), // Total tax amount
  totalAmountAfterTax: decimal("total_amount_after_tax", { precision: 10, scale: 2 }).notNull(), // Final amount
  amountInWords: text("amount_in_words").notNull(), // Amount in words
  customEmailBody: text("custom_email_body"), // Optional custom email body for this client
  customSenderEmail: text("custom_sender_email"), // Optional custom sender email for this client
  customSenderName: text("custom_sender_name"), // Optional custom sender name for this client
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique().on(table.name, table.atSite),
]);

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  invoiceNumber: text("invoice_number").notNull().unique(),
  dated: timestamp("dated").notNull(), // Invoice date
  monthYear: text("month_year").notNull(), // e.g., "JULY 2025"
  status: invoiceStatus("status").notNull().default('pending'),
  pdfPath: text("pdf_path"),
  emailSentAt: timestamp("email_sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const templates = pgTable("templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  filePath: text("file_path").notNull(),
  version: text("version").notNull().default('1.0'),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const logEntries = pgTable("log_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").references(() => invoices.id),
  clientId: varchar("client_id").references(() => clients.id),
  action: logAction("action").notNull(),
  status: text("status").default('info'),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Email configuration table
export const emailSettings = pgTable("email_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  smtpHost: text("smtp_host").notNull().default('smtp.gmail.com'),
  smtpPort: integer("smtp_port").notNull().default(587),
  smtpSecure: integer("smtp_secure").notNull().default(0), // 0 for false, 1 for true
  smtpUser: text("smtp_user"),
  smtpPassword: text("smtp_password"),
  fromEmail: text("from_email").notNull().default('invoices@company.com'),
  fromName: text("from_name").notNull().default('INDOESSARR ENGINEERS & ASSOCIATES'),
  replyTo: text("reply_to"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const clientsRelations = relations(clients, ({ many }) => ({
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  logEntries: many(logEntries),
}));

export const logEntriesRelations = relations(logEntries, ({ one }) => ({
  invoice: one(invoices, {
    fields: [logEntries.invoiceId],
    references: [invoices.id],
  }),
}));

// Insert schemas
export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  invoiceNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
});

export const insertLogEntrySchema = createInsertSchema(logEntries).omit({
  id: true,
  timestamp: true,
});

export const insertEmailSettingsSchema = createInsertSchema(emailSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type LogEntry = typeof logEntries.$inferSelect;
export type InsertLogEntry = z.infer<typeof insertLogEntrySchema>;
export type EmailSettings = typeof emailSettings.$inferSelect;
export type InsertEmailSettings = z.infer<typeof insertEmailSettingsSchema>;

// Extended types with relations
export type ClientWithInvoices = Client & {
  invoices: Invoice[];
};

export type InvoiceWithClient = Invoice & {
  client: Client;
};

export type InvoiceWithLogs = Invoice & {
  logEntries: LogEntry[];
};
