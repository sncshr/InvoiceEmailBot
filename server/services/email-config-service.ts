import { storage } from '../storage.js';
import type { EmailSettings, InsertEmailSettings } from '@shared/schema';

export class EmailConfigService {
  async getActiveEmailSettings(): Promise<EmailSettings | null> {
    try {
      const settings = await storage.getActiveEmailSettings();
      return settings;
    } catch (error) {
      console.error('Failed to get email settings:', error);
      return null;
    }
  }

  async createDefaultEmailSettings(): Promise<EmailSettings> {
    const defaultSettings: InsertEmailSettings = {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpSecure: 0,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: 'invoices@indoessarr.com',
      fromName: 'INDOESSARR ENGINEERS & ASSOCIATES',
      replyTo: 'support@indoessarr.com',
      isActive: 1
    };

    return await storage.createEmailSettings(defaultSettings);
  }

  async updateEmailSettings(id: string, settings: Partial<InsertEmailSettings>): Promise<EmailSettings | null> {
    try {
      return await storage.updateEmailSettings(id, settings);
    } catch (error) {
      console.error('Failed to update email settings:', error);
      return null;
    }
  }

  async testEmailConfiguration(settings: EmailSettings): Promise<boolean> {
    try {
      // Basic validation
      if (!settings.smtpHost || !settings.smtpPort || !settings.fromEmail) {
        return false;
      }

      // Additional validation for SMTP credentials
      if (!settings.smtpUser || !settings.smtpPassword) {
        console.warn('SMTP credentials not configured');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Email configuration test failed:', error);
      return false;
    }
  }

  async ensureDefaultSettings(): Promise<EmailSettings> {
    let settings = await this.getActiveEmailSettings();
    
    if (!settings) {
      console.log('No email settings found, creating default settings...');
      settings = await this.createDefaultEmailSettings();
    }
    
    return settings;
  }
}

export const emailConfigService = new EmailConfigService();