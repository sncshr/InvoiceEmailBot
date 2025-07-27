import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InvoiceWithClient } from "@shared/schema";
import { Download, Send } from "lucide-react";

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceWithClient | null;
  onSend?: (invoiceId: string) => void;
}

export default function InvoicePreviewModal({
  isOpen,
  onClose,
  invoice,
  onSend,
}: InvoicePreviewModalProps) {
  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice Preview - {invoice.invoiceNumber}</DialogTitle>
          <DialogDescription>
            Preview of invoice for {invoice.client.name}
          </DialogDescription>
        </DialogHeader>

        <div className="border rounded-lg p-8 bg-white">
          {/* Invoice Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">INVOICE</h1>
            <h2 className="text-xl font-semibold text-slate-700">Invoice #{invoice.invoiceNumber}</h2>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Invoice Details</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Issue Date:</strong> {new Date(invoice.issueDate).toLocaleDateString()}</p>
                <p><strong>Due Date:</strong> {new Date(invoice.dueDate).toLocaleDateString()}</p>
                <p><strong>Period:</strong> {invoice.period}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Bill To</h3>
              <div className="text-sm">
                <p className="font-medium">{invoice.client.name}</p>
                <p>{invoice.client.email}</p>
                <div className="whitespace-pre-line">{invoice.client.address}</div>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="border-t border-slate-200 pt-6 mb-8">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total Amount Due:</span>
              <span className="text-2xl font-bold text-slate-900">
                {invoice.currency || 'USD'} {invoice.amount}
              </span>
            </div>
          </div>

          {/* Contract Terms */}
          {invoice.client.contractTerms && (
            <div className="border-t border-slate-200 pt-6">
              <h3 className="font-semibold text-slate-900 mb-3">Contract Terms</h3>
              <p className="text-sm text-slate-600 whitespace-pre-line">
                {invoice.client.contractTerms}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2" size={16} />
              Download PDF
            </Button>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {onSend && invoice.status === 'pending' && (
              <Button 
                onClick={() => onSend(invoice.id)}
                className="bg-green-500 hover:bg-green-600"
              >
                <Send className="mr-2" size={16} />
                Send Invoice
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
