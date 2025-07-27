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
import { Search, Plus, Edit, Eye, MoreHorizontal } from "lucide-react";
import AddClientModal from "@/components/modals/add-client-modal";
import EditClientModal from "@/components/modals/edit-client-modal";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Clients() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients, isLoading } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: api.getClients,
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteClient,
    onSuccess: () => {
      toast({
        title: "Client Deleted",
        description: "Client has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete client.",
        variant: "destructive",
      });
    },
  });

  const filteredClients = clients?.filter((client: any) => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && client.totalAmountAfterTax > 0);
    return matchesSearch && matchesStatus;
  }) || [];

  // Determine if all clients have the same name
  const allClientsSameName = clients && clients.length > 0 && clients.every((c: any) => c.name === clients[0].name);

  const handleEditClient = (client: any) => {
    setSelectedClient(client);
    setIsEditModalOpen(true);
  };

  const getClientInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
  };

  const getStatusColor = (amount: number) => {
    return amount > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";
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
              <CardTitle>Client Management</CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                Manage your {clients?.length || 0} clients and their contract details
              </p>
            </div>
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Plus className="mr-2" size={16} />
              Add Client
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Search and Filter */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <Input
                placeholder="Search clients..."
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
                <SelectItem value="all">All Clients</SelectItem>
                <SelectItem value="active">Active Contracts</SelectItem>
                <SelectItem value="pending">Pending Setup</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clients Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Contract Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-slate-500">
                        {searchTerm || statusFilter !== "all" 
                          ? "No clients match your filters" 
                          : "No clients found. Add your first client to get started."
                        }
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client: any) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {getClientInitials(allClientsSameName ? client.atSite : client.name)}
                            </span>
                          </div>
                          <span className="font-medium">{allClientsSameName ? client.atSite : client.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">{client.email || 'N/A'}</TableCell>
                      <TableCell className="font-medium">
                        ₹{parseFloat(client.totalAmountAfterTax || 0).toLocaleString()}/mo
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary"
                          className={getStatusColor(parseFloat(client.totalAmountAfterTax || 0))}
                        >
                          {parseFloat(client.totalAmountAfterTax || 0) > 0 ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {new Date(client.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClient(client)}>
                              <Edit size={16} className="mr-2" />
                              Edit Client
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye size={16} className="mr-2" />
                              View Invoices
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => deleteMutation.mutate(client.id)}
                              className="text-red-600"
                            >
                              Delete Client
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {filteredClients.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-slate-600">
                Showing {filteredClients.length} of {clients?.length || 0} clients
              </p>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm" className="bg-blue-500 text-white">
                  1
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
      
      {selectedClient && (
        <EditClientModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedClient(null);
          }}
          client={selectedClient}
        />
      )}
    </div>
  );
}
