import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertClientSchema } from "@shared/schema";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const clientSchema = insertClientSchema.extend({
  rate: z.string().min(1, "Rate is required"),
  cgst: z.string().min(1, "CGST amount is required"), 
  sgst: z.string().min(1, "SGST amount is required"),
  igst: z.string().min(1, "IGST amount is required"),
  totalTax: z.string().min(1, "Total tax is required"),
  totalAmountAfterTax: z.string().min(1, "Total amount after tax is required"),
  customEmailBody: z.string().optional().default(''),
  customSenderEmail: z.string().optional().default(''),
  customSenderName: z.string().optional().default(''),
});

type ClientFormData = z.infer<typeof clientSchema>;

export default function AddClientModal({ isOpen, onClose }: AddClientModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      email: "",
      atSite: "",
      gstin: "",
      state: "",
      serviceDescription: "",
      hsnSacCode: "",
      rate: "",
      cgst: "",
      sgst: "",
      igst: "0.00",
      totalTax: "",
      totalAmountAfterTax: "",
      amountInWords: "",
      customEmailBody: "",
      customSenderEmail: "",
      customSenderName: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ClientFormData) => {
      const formattedData = {
        ...data,
        rate: data.rate,
        cgst: data.cgst,
        sgst: data.sgst, 
        igst: data.igst,
        totalTax: data.totalTax,
        totalAmountAfterTax: data.totalAmountAfterTax,
      };
      return api.createClient(formattedData);
    },
    onSuccess: () => {
      toast({
        title: "Client Added",
        description: "GST client has been successfully added.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      form.reset();
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add client. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ClientFormData) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New GST Client</DialogTitle>
          <DialogDescription>
            Add a new client for GST invoice generation. Fill in all the required tax details.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Client Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Business Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Kangra Central Co-Operative Bank LTD." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="client@email.com" type="email" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="atSite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>At Site</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., AJOULI MOR BRANCH" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gstin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GSTIN (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 02AAAJT0749B1ZM" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Himachal Pradesh" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Service Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="serviceDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g., D G SET RENT (INSTALLED IN BANK) FOR THE MONTH OF..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hsnSacCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HSN/SAC Code (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="HSN/SAC Code" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tax Calculation (Pre-calculated amounts in INR) */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tax Breakdown (INR)</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Rate</FormLabel>
                      <FormControl>
                        <Input placeholder="5500.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cgst"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CGST Amount</FormLabel>
                      <FormControl>
                        <Input placeholder="495.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sgst"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SGST Amount</FormLabel>
                      <FormControl>
                        <Input placeholder="495.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="igst"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IGST Amount</FormLabel>
                      <FormControl>
                        <Input placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="totalTax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Tax Amount</FormLabel>
                      <FormControl>
                        <Input placeholder="990.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="totalAmountAfterTax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Amount After Tax</FormLabel>
                      <FormControl>
                        <Input placeholder="6490.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="amountInWords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount in Words</FormLabel>
                    <FormControl>
                      <Input placeholder="SIX THOUSAND FOUR HUNDRED NINETY ONLY" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Per-client email configuration */}
            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-semibold">Email Customization (Optional)</h3>
              <FormField
                control={form.control}
                name="customEmailBody"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Email Body</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Custom email body for this client (HTML allowed)" rows={3} {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customSenderEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Sender Email</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. billing@client.com" type="email" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customSenderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Sender Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Client Billing Dept." {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Adding..." : "Add Client"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}