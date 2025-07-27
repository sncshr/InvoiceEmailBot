import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EmailSettingsModal from "@/components/modals/email-settings-modal";
import EditEmailTemplateModal from "@/components/modals/edit-email-template-modal";
import { Pencil, Mail, Eye } from "lucide-react";

export default function Settings() {
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState<string>(`<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">GST Tax Invoice</h2>
  <p>Dear {{clientName}},</p>
  <p>Please find attached your GST tax invoice for the services provided.</p>
  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <strong>Invoice Details:</strong><br />
    Invoice Number: {{invoiceNumber}}<br />
    Company: {{senderName}}<br />
    GSTIN: {{clientGSTIN}}
  </div>
  <p>Thank you for your business!</p>
  <hr style="border: 1px solid #eee; margin: 20px 0;" />
  <p style="font-size: 12px; color: #666;">
    This is an automated email. Please do not reply to this email address.
  </p>
</div>`);

  const handleSaveTemplate = (newTemplate: string) => {
    setEmailTemplate(newTemplate);
  };

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-8">
      {/* Email Service Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Email Service Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 mb-4">
            Configure global sender email, SMTP server, and reply-to details for all outgoing invoice emails. These settings apply to all clients unless a client has custom email settings.
          </p>
          <Button onClick={() => setEmailModalOpen(true)} className="bg-blue-500 hover:bg-blue-600 text-white">
            <Mail className="h-4 w-4 mr-2" />
            Configure Email Service
          </Button>
        </CardContent>
      </Card>

      {/* Email Template Preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Email Template</CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-slate-600 border-slate-300"
              onClick={() => {
                // Open preview in a new window/tab
                const previewWindow = window.open('', '_blank');
                if (previewWindow) {
                  previewWindow.document.write(emailTemplate.replace(
                    /{{(\w+)}}/g, 
                    (_, p1) => {
                      const placeholders: Record<string, string> = {
                        clientName: 'ABC Company',
                        invoiceNumber: 'INV-2023-001',
                        invoiceDate: '01/01/2023',
                        dueDate: '15/01/2023',
                        totalAmount: '₹6490.00',
                        senderName: 'Your Business',
                        clientGSTIN: 'GSTIN123456789',
                      };
                      return placeholders[p1] || `{{${p1}}}`;
                    }
                  ));
                  previewWindow.document.close();
                }
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button 
              onClick={() => setTemplateModalOpen(true)} 
              variant="default" 
              size="sm"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 mb-4">
            This is the default email template used for invoice delivery. You can override this for individual clients in their settings.
          </p>
          <div className="border rounded bg-slate-50 p-4 text-sm text-slate-700 overflow-auto max-h-[400px]">
            <div dangerouslySetInnerHTML={{ __html: emailTemplate }} />
          </div>
          <div className="mt-4 text-xs text-slate-500">
            <p className="font-semibold mb-1">Available Placeholders:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><code>{"{{clientName}}"}</code> - Client's business name</li>
              <li><code>{"{{invoiceNumber}}"}</code> - The invoice number</li>
              <li><code>{"{{senderName}}"}</code> - Your business name</li>
              <li><code>{"{{clientGSTIN}}"}</code> - Client's GSTIN</li>
              <li><code>{"{{invoiceDate}}"}</code> - Date the invoice was issued</li>
              <li><code>{"{{dueDate}}"}</code> - Invoice due date</li>
              <li><code>{"{{totalAmount}}"}</code> - The total invoice amount</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Per-client Email Customization Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Per-client Email Customization</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 mb-2">
            You can set a custom email body, sender name, and sender email for any client. Go to <b>Clients</b>, edit a client, and fill in the email customization fields. If left blank, the global settings above will be used.
          </p>
          <ul className="list-disc pl-6 text-slate-600 text-sm">
            <li>Custom email body supports HTML and placeholders (e.g., <code>{"{{clientName}}"}</code>, <code>{"{{invoiceNumber}}"}</code>).</li>
            <li>Sender name/email will override the global sender for that client only.</li>
            <li>Leave fields blank to use the global default.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Future Settings Section (placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>Other Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500">More configuration options coming soon.</p>
        </CardContent>
      </Card>

      <EmailSettingsModal isOpen={emailModalOpen} onClose={() => setEmailModalOpen(false)} />
      
      <EditEmailTemplateModal 
        isOpen={templateModalOpen} 
        onClose={() => setTemplateModalOpen(false)}
        currentTemplate={emailTemplate}
        onSave={handleSaveTemplate}
      />
    </div>
  );
}