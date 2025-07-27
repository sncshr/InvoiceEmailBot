import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Eye, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UploadTemplateModal } from "@/components/modals/upload-template-modal";
import { PreviewTemplateModal } from "@/components/modals/preview-template-modal";

export default function Templates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["/api/templates"],
    queryFn: api.getTemplates,
  });

  const activateMutation = useMutation({
    mutationFn: api.activateTemplate,
    onSuccess: () => {
      toast({
        title: "Template Activated",
        description: "Template has been set as active.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to activate template.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 bg-slate-200 rounded"></div>
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
              <CardTitle>Template Management</CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                Manage invoice templates and choose the active template
              </p>
            </div>
            <Button 
              className="bg-blue-500 hover:bg-blue-600"
              onClick={() => setUploadModalOpen(true)}
            >
              <Upload className="mr-2" size={16} />
              Upload New Template
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {templates && templates.length > 0 ? (
            <div className="grid gap-4">
              {templates.map((template: any) => (
                <div
                  key={template.id}
                  className="border rounded-lg p-6 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Upload className="text-blue-600" size={24} />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900">{template.name}</h3>
                        <p className="text-sm text-slate-500">
                          Version {template.version} • Created {new Date(template.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Badge 
                        variant="secondary"
                        className={template.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}
                      >
                        {template.isActive ? (
                          <>
                            <CheckCircle size={14} className="mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <Clock size={14} className="mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setPreviewModalOpen(true);
                        }}
                      >
                        <Eye size={16} className="mr-2" />
                        Preview
                      </Button>
                      
                      {!template.isActive && (
                        <Button
                          size="sm"
                          onClick={() => activateMutation.mutate(template.id)}
                          disabled={activateMutation.isPending}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          Activate
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Upload className="text-slate-400" size={32} />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Templates Found</h3>
              <p className="text-slate-500 mb-6">
                Upload your first invoice template to get started with automated invoice generation.
              </p>
              <Button 
                className="bg-blue-500 hover:bg-blue-600"
                onClick={() => setUploadModalOpen(true)}
              >
                <Upload className="mr-2" size={16} />
                Upload Template
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Template Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Template Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-slate-900 mb-2">Supported Formats</h4>
              <p className="text-slate-600">
                Upload DOCX templates only. DOCX templates support dynamic placeholders for GST invoice generation.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-slate-900 mb-2">Available Placeholders for GST Invoice</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-600">
                <p>• <code className="bg-slate-100 px-1 rounded">{"{{invoiceNumber}}"}</code> - Invoice number</p>
                <p>• <code className="bg-slate-100 px-1 rounded">{"{{dated}}"}</code> - Invoice date</p>
                <p>• <code className="bg-slate-100 px-1 rounded">{"{{clientName}}"}</code> - Client business name</p>
                <p>• <code className="bg-slate-100 px-1 rounded">{"{{atSite}}"}</code> - At Site field</p>
                <p>• <code className="bg-slate-100 px-1 rounded">{"{{gstin}}"}</code> - Client GSTIN</p>
                <p>• <code className="bg-slate-100 px-1 rounded">{"{{state}}"}</code> - Client state</p>
                <p>• <code className="bg-slate-100 px-1 rounded">{"{{monthYear}}"}</code> - Month/Year for billing</p>
                <p>• <code className="bg-slate-100 px-1 rounded">{"{{serviceDescription}}"}</code> - Service description</p>
                <p>• <code className="bg-slate-100 px-1 rounded">{"{{hsnSacCode}}"}</code> - HSN/SAC code</p>
                <p>• <code className="bg-slate-100 px-1 rounded">{"{{rate}}"}</code> - Base rate (INR)</p>
                <p>• <code className="bg-slate-100 px-1 rounded">{"{{cgst}}"}</code> - CGST amount</p>
                <p>• <code className="bg-slate-100 px-1 rounded">{"{{sgst}}"}</code> - SGST amount</p>
                <p>• <code className="bg-slate-100 px-1 rounded">{"{{igst}}"}</code> - IGST amount</p>
                <p>• <code className="bg-slate-100 px-1 rounded">{"{{totalTax}}"}</code> - Total tax amount</p>
                <p>• <code className="bg-slate-100 px-1 rounded">{"{{totalAmountAfterTax}}"}</code> - Final amount</p>
                <p>• <code className="bg-slate-100 px-1 rounded">{"{{amountInWords}}"}</code> - Amount in words</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-slate-900 mb-2">Best Practices</h4>
              <ul className="text-slate-600 space-y-1">
                <li>• Use consistent formatting throughout the template</li>
                <li>• Include your company logo and contact information</li>
                <li>• Test templates with sample data before activation</li>
                <li>• Ensure watermark placement doesn't interfere with content</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <UploadTemplateModal 
        open={uploadModalOpen} 
        onOpenChange={setUploadModalOpen} 
      />
      
      <PreviewTemplateModal 
        open={previewModalOpen} 
        onOpenChange={setPreviewModalOpen}
        template={selectedTemplate}
      />
    </div>
  );
}
