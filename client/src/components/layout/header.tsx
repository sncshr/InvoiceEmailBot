import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Bell, Play } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Header() {
  const [location] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getPageTitle = () => {
    switch (location) {
      case "/":
        return "Dashboard";
      case "/clients":
        return "Clients";
      case "/invoices":
        return "Invoices";
      case "/templates":
        return "Templates";
      case "/logs":
        return "Activity Logs";
      default:
        return "Dashboard";
    }
  };

  const getPageDescription = () => {
    switch (location) {
      case "/":
        return "Welcome back! Here's your invoice overview.";
      case "/clients":
        return "Manage your clients and their contract details";
      case "/invoices":
        return "Track and manage all invoices";
      case "/templates":
        return "Manage invoice templates";
      case "/logs":
        return "View system activity and logs";
      default:
        return "Welcome back! Here's your invoice overview.";
    }
  };

  const batchMutation = useMutation({
    mutationFn: api.runBatchProcess,
    onSuccess: (result) => {
      toast({
        title: "Batch Process Complete",
        description: `Processed ${result.processed} invoices. ${result.succeeded} succeeded, ${result.failed} failed.`,
        variant: result.failed > 0 ? "destructive" : "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    },
    onError: () => {
      toast({
        title: "Batch Process Failed",
        description: "Failed to run monthly batch process",
        variant: "destructive",
      });
    },
  });

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{getPageTitle()}</h2>
          <p className="text-sm text-slate-500 mt-1">{getPageDescription()}</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => batchMutation.mutate()}
            disabled={batchMutation.isPending}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Play className="mr-2" size={16} />
            {batchMutation.isPending ? "Running..." : "Run Monthly Batch"}
          </Button>
          
          <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
