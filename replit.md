# Invoicer App

## Overview

A GST-compliant web-based invoicing application for Indian businesses that automates the generation and delivery of tax invoices. The system handles 87+ client contracts with monthly automated invoicing, replacing manual DOCX templates with a centralized database-driven solution for GST invoice creation, PDF generation, and email delivery.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Library**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query for server state, React hooks for local state
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL via Neon serverless
- **ORM**: Drizzle ORM with migrations
- **Services**: Modular service classes for PDF generation, email delivery, and scheduling

### Key Components

#### Database Schema
- **Clients**: Store GST client information including business name, At Site, GSTIN, state, service description, and pre-calculated tax amounts (rate, CGST, SGST, IGST, total tax, final amount, amount in words)
- **Invoices**: Track GST invoice records with invoice number, dated field, month/year billing period, status, and PDF paths
- **Templates**: Manage DOCX invoice templates with versioning (DOCX only for GST compliance)
- **Log Entries**: Audit trail for all invoice operations (generation, sending, failures)

#### Core Services
- **PDF Service**: Generates HTML invoices and converts to PDF using Puppeteer
- **Email Service**: Handles SMTP email delivery with PDF attachments via Nodemailer
- **Scheduler Service**: Manages automated monthly invoice generation using node-cron

#### API Structure
- RESTful endpoints for CRUD operations on clients, invoices, and templates
- Batch processing endpoints for automated invoice generation
- Statistics endpoints for dashboard metrics
- File upload handling for template management

## Data Flow

1. **GST Client Management**: Admin creates/updates client records with GST details, pre-calculated tax amounts in INR
2. **Monthly Invoice Generation**: Automated monthly process creates GST tax invoices for all 87+ clients
3. **DOCX Template Processing**: System processes DOCX templates with GST placeholders and converts to PDF
4. **Email Delivery**: GST-compliant PDFs are automatically emailed to clients with tracking
5. **Logging**: All operations are logged with status and error details for monitoring

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database for production
- **Drizzle Kit**: Database migrations and schema management

### Email Delivery
- **Nodemailer**: SMTP email delivery
- **Gmail SMTP**: Configured as default email provider

### PDF Processing
- **Puppeteer**: Headless Chrome for HTML to PDF conversion
- **PDF-lib**: PDF manipulation and watermarking

### UI/UX
- **Radix UI**: Accessible component primitives
- **Lucide Icons**: Consistent icon library
- **Tailwind CSS**: Utility-first styling

## Deployment Strategy

### Development
- **Vite Dev Server**: Hot module replacement for frontend
- **TSX**: TypeScript execution for backend development
- **Environment Variables**: Database URL and SMTP credentials

### Production Build
- **Frontend**: Vite builds React app to static files
- **Backend**: ESBuild bundles Node.js server
- **Database**: Drizzle migrations applied on deployment

### Architecture Decisions

#### Database Choice
- **Problem**: Need reliable data persistence for invoices and client information
- **Solution**: PostgreSQL via Neon for ACID compliance and complex queries
- **Rationale**: Ensures data integrity for financial records and supports relationship queries

#### PDF Generation Strategy
- **Problem**: Convert invoice data to professional PDF documents
- **Solution**: HTML templates + Puppeteer for PDF conversion
- **Rationale**: More flexible than direct PDF libraries, easier to style and maintain

#### Email Automation
- **Problem**: Reliable invoice delivery to clients
- **Solution**: Nodemailer with Gmail SMTP and retry logic
- **Rationale**: Battle-tested solution with good error handling and delivery tracking

#### Monorepo Structure
- **Problem**: Share types between frontend and backend
- **Solution**: Shared schema directory with TypeScript definitions
- **Rationale**: Ensures type safety across the full stack and reduces duplication

---

### 1. **Install Dependencies**
From the project root, run:
```sh
npm install
```

---

### 2. **Set Up Environment Variables**

You **must** set a `DATABASE_URL` environment variable for PostgreSQL (Neon or local).  
The format is typically:
```
DATABASE_URL=postgres://username:password@host:port/database
```
You’ll also need SMTP credentials for email sending, but these are stored in the database (`email_settings` table) and can be configured via the app UI or directly in the DB.

---

### 3. **Run Database Migrations**

To create the required tables, run:
```sh
npm run db:push
```
This uses Drizzle ORM to push the schema defined in `shared/schema.ts` to your database.

---

### 4. **Start the Application (Backend + Frontend)**

For development (hot reload, etc.):
```sh
npm run dev
```
- This starts the backend (Express/Node) and serves the React frontend via Vite on port 5000 (or the port set in your `PORT` env variable).

---

### 5. **Access the App**

Open your browser to:  
[http://localhost:5000](http://localhost:5000)

---

### 6. **(Optional) Configure Email Settings**

- The app uses Gmail SMTP by default, but you can update SMTP settings via the UI or by inserting into the `email_settings` table.

---

#### **Summary of Required Environment Variables**
- `DATABASE_URL` (required)
- `PORT` (optional, defaults to 5000)

---

**Ready to proceed?**  
I can run the setup commands for you, but I’ll need you to provide a valid `DATABASE_URL` for your local or cloud PostgreSQL instance.  
Would you like to continue and, if so, what database URL should I use?