import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const emailTemplateSchema = z.object({
  htmlContent: z.string().min(10, "Template content is too short"),
});

type EmailTemplateFormData = z.infer<typeof emailTemplateSchema>;

interface EditEmailTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTemplate?: string;
  onSave?: (template: string) => void;
}

export default function EditEmailTemplateModal({ 
  isOpen, 
  onClose,
  currentTemplate = defaultTemplate,
  onSave
}: EditEmailTemplateModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<EmailTemplateFormData>({
    resolver: zodResolver(emailTemplateSchema),
    defaultValues: {
      htmlContent: currentTemplate,
    },
  });

  const onSubmit = async (data: EmailTemplateFormData) => {
    setIsLoading(true);
    try {
      // In a real app, you would send this to your backend
      // await api.updateEmailTemplate(data.htmlContent);
      
      setTimeout(() => {
        if (onSave) {
          onSave(data.htmlContent);
        }
        
        toast({
          title: "Template saved",
          description: "Your email template has been updated successfully.",
        });
        setIsLoading(false);
        onClose();
      }, 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save email template. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const availablePlaceholders = [
    { name: "{{clientName}}", description: "Client's business name" },
    { name: "{{invoiceNumber}}", description: "The invoice number" },
    { name: "{{invoiceDate}}", description: "Date the invoice was issued" },
    { name: "{{dueDate}}", description: "Invoice due date" },
    { name: "{{totalAmount}}", description: "The total invoice amount" },
    { name: "{{senderName}}", description: "Your business name" },
    { name: "{{clientGSTIN}}", description: "Client's GSTIN" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Email Template</DialogTitle>
          <DialogDescription>
            Customize the email template used when sending invoices. HTML formatting is supported.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="htmlContent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Template HTML</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter your HTML email template here..." 
                      className="font-mono min-h-[300px] text-sm"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    This is the HTML template that will be used when sending emails.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2 bg-slate-50 p-4 rounded-md">
              <h3 className="text-sm font-semibold">Available Placeholders</h3>
              <p className="text-xs text-slate-600 mb-2">Use these placeholders in your template to insert dynamic values:</p>
              <div className="flex flex-wrap gap-2">
                {availablePlaceholders.map((placeholder) => (
                  <Badge 
                    key={placeholder.name}
                    variant="secondary" 
                    className="cursor-pointer hover:bg-slate-200"
                    onClick={() => {
                      const currentContent = form.getValues().htmlContent || '';
                      form.setValue('htmlContent', currentContent + placeholder.name);
                    }}
                  >
                    {placeholder.name}
                    <span className="ml-1 opacity-70 text-xs">- {placeholder.description}</span>
                  </Badge>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Template"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const defaultTemplate = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
</div>`;
