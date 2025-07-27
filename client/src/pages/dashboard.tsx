import { useQuery } from "@tanstack/react-query";
import { api, Statistics } from "@/lib/api";
import StatCard from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  UserPlus,
  PlusCircle,
  Upload,
  BarChart3,
  Eye,
  RotateCcw,
  Check,
  X,
  Play
} from "lucide-react";
import { useState } from "react";
import AddClientModal from "@/components/modals/add-client-modal";

export default function Dashboard() {
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);

  const { data: statistics, isLoading: statsLoading } = useQuery<Statistics>({
    queryKey: ["/api/statistics"],
  });

  const { data: recentLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["/api/logs"],
    queryFn: () => api.getLogs({ limit: 5 }),
  });

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-slate-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getActivityIcon = (action: string, status: string) => {
    if (status === 'success') {
      return <Check className="text-green-600" size={16} />;
    } else if (status === 'failed') {
      return <X className="text-red-600" size={16} />;
    } else if (action === 'generated') {
      return <Play className="text-blue-600" size={16} />;
    }
    return <Clock className="text-amber-600" size={16} />;
  };

  const getActivityBgColor = (status: string) => {
    if (status === 'success') return 'bg-green-50';
    if (status === 'failed') return 'bg-red-50';
    return 'bg-slate-50';
  };

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Clients"
          value={statistics?.totalClients || 0}
          icon={Users}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
          change="+2"
          changeColor="text-green-600"
        />
        
        <StatCard
          title="Pending Invoices"
          value={statistics?.pendingInvoices || 0}
          icon={Clock}
          iconColor="text-amber-600"
          iconBgColor="bg-amber-100"
          change="Due today"
          changeColor="text-amber-600"
        />
        
        <StatCard
          title="Sent This Month"
          value={statistics?.sentThisMonth || 0}
          icon={CheckCircle}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
          change="86%"
          changeColor="text-green-600"
        />
        
        <StatCard
          title="Failed Deliveries"
          value={statistics?.failedDeliveries || 0}
          icon={AlertTriangle}
          iconColor="text-red-600"
          iconBgColor="bg-red-100"
          action={{
            label: "View & Retry →",
            onClick: () => window.location.href = "/invoices?status=failed",
            color: "text-red-600 hover:text-red-700"
          }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Activity</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <a href="/logs">View All</a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-4 p-3 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-slate-200 rounded w-3/4 mb-1"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentLogs && recentLogs.length > 0 ? (
                <div className="space-y-4">
                  {recentLogs.map((log: any) => (
                    <div key={log.id} className={`flex items-center space-x-4 p-3 ${getActivityBgColor(log.status)} rounded-lg`}>
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border">
                        {getActivityIcon(log.action, log.status)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{log.details}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {log.status === 'failed' && (
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                          <RotateCcw size={14} className="mr-1" />
                          Retry
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p>No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Schedule Info */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                onClick={() => setIsAddClientModalOpen(true)}
                className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <UserPlus className="text-blue-600" size={20} />
                  <span className="font-medium text-slate-900">Add New Client</span>
                </div>
              </button>
              
              <button className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <PlusCircle className="text-green-600" size={20} />
                  <span className="font-medium text-slate-900">Create Invoice</span>
                </div>
              </button>
              
              <button className="w-full text-left p-3 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <Upload className="text-amber-600" size={20} />
                  <span className="font-medium text-slate-900">Upload Template</span>
                </div>
              </button>
              
              <button className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="text-purple-600" size={20} />
                  <span className="font-medium text-slate-900">View Reports</span>
                </div>
              </button>
            </CardContent>
          </Card>

          {/* Schedule Info */}
          <Card>
            <CardHeader>
              <CardTitle>Next Scheduled Run</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900">
                  {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
                <p className="text-sm text-slate-500 mt-1">9:00 AM UTC</p>
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-600">
                    Auto-batch processing for all {statistics?.totalClients || 0} clients
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => {}}
              >
                Configure Schedule
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <AddClientModal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
      />
    </div>
  );
}
