import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  FileText, 
  Play, 
  Eye, 
  Download, 
  Send, 
  RotateCcw,
  AlertCircle
} from "lucide-react";
import InvoicePreviewModal from "@/components/modals/invoice-preview-modal";
import { useToast } from "@/hooks/use-toast";

export default function Invoices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["/api/invoices"],
    queryFn: api.getInvoices,
  });

  const sendMutation = useMutation({
    mutationFn: api.sendInvoice,
    onSuccess: (result, invoiceId) => {
      if (result.success) {
        toast({
          title: "Invoice Sent",
          description: "Invoice has been sent successfully.",
        });
      } else {
        toast({
          title: "Send Failed",
          description: "Failed to send invoice. Please try again.",
          variant: "destructive",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send invoice.",
        variant: "destructive",
      });
    },
  });

  const filteredInvoices = invoices?.filter((invoice: any) => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.client.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-amber-100 text-amber-700",
      sent: "bg-green-100 text-green-700",
      failed: "bg-red-100 text-red-700",
    };
    return variants[status as keyof typeof variants] || "bg-slate-100 text-slate-700";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Invoice Management</CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                Track and manage all invoices
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="bg-green-50 hover:bg-green-100 text-green-700">
                <FileText className="mr-2" size={16} />
                Generate Invoice
              </Button>
              <Button className="bg-blue-500 hover:bg-blue-600">
                <Play className="mr-2" size={16} />
                Batch Send
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <Input
                placeholder="Search invoices..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" className="w-48" />
          </div>

          {/* Invoices Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Sent</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-slate-500">
                        {searchTerm || statusFilter !== "all" 
                          ? "No invoices match your filters" 
                          : "No invoices found. Create your first invoice to get started."
                        }
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice: any) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-sm font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>{invoice.client.name}</TableCell>
                      <TableCell className="font-medium">
                        {invoice.currency || 'USD'} {parseFloat(invoice.amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-slate-600">{invoice.period}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary"
                          className={getStatusBadge(invoice.status)}
                        >
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {invoice.emailSentAt 
                          ? new Date(invoice.emailSentAt).toLocaleDateString()
                          : "-"
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewInvoice(invoice)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Eye size={16} />
                          </Button>
                          
                          {invoice.pdfPath && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                            >
                              <Download size={16} />
                            </Button>
                          )}
                          
                          {invoice.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => sendMutation.mutate(invoice.id)}
                              disabled={sendMutation.isPending}
                              className="text-purple-600 hover:text-purple-700"
                            >
                              <Send size={16} />
                            </Button>
                          )}
                          
                          {invoice.status === 'failed' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => sendMutation.mutate(invoice.id)}
                                disabled={sendMutation.isPending}
                                className="text-red-600 hover:text-red-700"
                              >
                                <RotateCcw size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-amber-600 hover:text-amber-700"
                              >
                                <AlertCircle size={16} />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <InvoicePreviewModal
        isOpen={!!previewInvoice}
        onClose={() => setPreviewInvoice(null)}
        invoice={previewInvoice}
        onSend={(id) => {
          sendMutation.mutate(id);
          setPreviewInvoice(null);
        }}
      />
    </div>
  );
}
