import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Check, X, Clock, Play, RotateCcw } from "lucide-react";

export default function Logs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["/api/logs"],
    queryFn: () => api.getLogs({ limit: 100 }),
  });

  const filteredLogs = logs?.filter((log: any) => {
    const matchesSearch = log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    return matchesSearch && matchesAction && matchesStatus;
  }) || [];

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'generated':
        return <Play className="text-blue-600" size={16} />;
      case 'sent':
        return <Check className="text-green-600" size={16} />;
      case 'failed':
        return <X className="text-red-600" size={16} />;
      case 'retried':
        return <RotateCcw className="text-amber-600" size={16} />;
      default:
        return <Clock className="text-slate-600" size={16} />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: "bg-green-100 text-green-700",
      failed: "bg-red-100 text-red-700",
      partial: "bg-amber-100 text-amber-700",
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
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-16 bg-slate-200 rounded"></div>
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
              <CardTitle>Activity Logs</CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                View system activity and invoice processing logs
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <Input
                placeholder="Search logs..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="generated">Generated</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="retried">Retried</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Logs List */}
          <div className="space-y-3">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                {searchTerm || actionFilter !== "all" || statusFilter !== "all" 
                  ? "No logs match your filters" 
                  : "No activity logs found"
                }
              </div>
            ) : (
              filteredLogs.map((log: any) => (
                <div
                  key={log.id}
                  className="flex items-start space-x-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-slate-200 mt-1">
                    {getActionIcon(log.action)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {log.details}
                      </p>
                      <div className="flex items-center space-x-2 ml-4">
                        <Badge 
                          variant="secondary"
                          className={getStatusBadge(log.status)}
                        >
                          {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">
                      {new Date(log.timestamp).toLocaleString()} 
                      {log.invoiceId && (
                        <span className="ml-2">• Invoice ID: {log.invoiceId}</span>
                      )}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Load More */}
          {filteredLogs.length > 0 && filteredLogs.length >= 100 && (
            <div className="text-center mt-6">
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Load More Logs
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {filteredLogs.filter((log: any) => log.status === 'success').length}
            </div>
            <div className="text-sm text-slate-600">Successful Operations</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {filteredLogs.filter((log: any) => log.status === 'failed').length}
            </div>
            <div className="text-sm text-slate-600">Failed Operations</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {filteredLogs.filter((log: any) => log.action === 'generated').length}
            </div>
            <div className="text-sm text-slate-600">Invoices Generated</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {filteredLogs.filter((log: any) => log.action === 'sent').length}
            </div>
            <div className="text-sm text-slate-600">Emails Sent</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
