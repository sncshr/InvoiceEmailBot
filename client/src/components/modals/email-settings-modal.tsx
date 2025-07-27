import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface EmailSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const emailSettingsSchema = z.object({
  smtpHost: z.string().min(1, "SMTP host is required"),
  smtpPort: z.number().min(1).max(65535),
  smtpSecure: z.boolean(),
  smtpUser: z.string().min(1, "SMTP username is required"),
  smtpPassword: z.string().min(1, "SMTP password is required"),
  fromEmail: z.string().email("Valid email address required"),
  fromName: z.string().min(1, "From name is required"),
  replyTo: z.string().email("Valid email address required").optional().or(z.literal("")),
});

type EmailSettingsFormData = z.infer<typeof emailSettingsSchema>;

export default function EmailSettingsModal({ isOpen, onClose }: EmailSettingsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: emailSettings } = useQuery({
    queryKey: ["/api/email-settings"],
    queryFn: api.getEmailSettings,
    enabled: isOpen,
  });

  const form = useForm<EmailSettingsFormData>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      smtpHost: emailSettings?.smtpHost || "smtp.gmail.com",
      smtpPort: emailSettings?.smtpPort || 587,
      smtpSecure: emailSettings?.smtpSecure === 1,
      smtpUser: emailSettings?.smtpUser || "",
      smtpPassword: emailSettings?.smtpPassword || "",
      fromEmail: emailSettings?.fromEmail || "invoices@indoessarr.com",
      fromName: emailSettings?.fromName || "INDOESSARR ENGINEERS & ASSOCIATES",
      replyTo: emailSettings?.replyTo || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: EmailSettingsFormData) => {
      const payload = {
        ...data,
        smtpSecure: data.smtpSecure ? 1 : 0,
      };
      
      if (emailSettings?.id) {
        return api.updateEmailSettings(emailSettings.id, payload);
      } else {
        return api.createEmailSettings(payload);
      }
    },
    onSuccess: () => {
      toast({
        title: "Email Settings Updated",
        description: "Email configuration has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/email-settings"] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update email settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const testMutation = useMutation({
    mutationFn: (data: EmailSettingsFormData) => api.testEmailSettings(data),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Email Test Successful",
          description: "Email configuration is working correctly.",
        });
      } else {
        toast({
          title: "Email Test Failed",
          description: result.message || "Email configuration test failed.",
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (data: EmailSettingsFormData) => {
    updateMutation.mutate(data);
  };

  const onTest = () => {
    const data = form.getValues();
    testMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Email Configuration</DialogTitle>
          <DialogDescription>
            Configure SMTP settings for automated invoice delivery.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* SMTP Server Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">SMTP Server Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="smtpHost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Host</FormLabel>
                      <FormControl>
                        <Input placeholder="smtp.gmail.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="smtpPort"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Port</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="587" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 587)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="smtpSecure"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Use TLS/SSL</FormLabel>
                      <FormDescription>
                        Enable secure connection (recommended for Gmail)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Authentication */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Authentication</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="smtpUser"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Username</FormLabel>
                      <FormControl>
                        <Input placeholder="your-email@gmail.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        Usually your email address
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="smtpPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="App password" {...field} />
                      </FormControl>
                      <FormDescription>
                        Use app password for Gmail
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Email Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Email Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fromEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Email</FormLabel>
                      <FormControl>
                        <Input placeholder="invoices@indoessarr.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fromName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Name</FormLabel>
                      <FormControl>
                        <Input placeholder="INDOESSARR ENGINEERS & ASSOCIATES" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="replyTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reply To (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="support@indoessarr.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={onTest}
                disabled={testMutation.isPending}
              >
                {testMutation.isPending ? "Testing..." : "Test Configuration"}
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}