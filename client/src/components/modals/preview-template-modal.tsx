import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Download, Code, FileText } from "lucide-react";

interface PreviewTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: any;
}

export function PreviewTemplateModal({ open, onOpenChange, template }: PreviewTemplateModalProps) {
  const [previewMode, setPreviewMode] = useState<'rendered' | 'source'>('rendered');

  const { data: previewData, isLoading } = useQuery({
    queryKey: ["/api/templates/preview", template?.id],
    queryFn: async () => {
      const response = await fetch(`/api/templates/${template.id}/preview`);
      if (!response.ok) {
        throw new Error('Failed to load preview');
      }
      return response.json();
    },
    enabled: open && !!template,
  });

  const getFileTypeIcon = (filePath: string) => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'html':
      case 'htm':
        return <Code className="h-4 w-4" />;
      case 'docx':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getFileType = (filePath: string) => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    return ext?.toUpperCase() || 'UNKNOWN';
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getFileTypeIcon(template.filePath)}
              <div>
                <DialogTitle>{template.name}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {getFileType(template.filePath)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    v{template.version}
                  </Badge>
                  {template.isActive && (
                    <Badge variant="default" className="text-xs bg-green-500">
                      Active
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const link = document.createElement('a');
                link.href = template.filePath;
                link.download = `${template.name}.${getFileType(template.filePath).toLowerCase()}`;
                link.click();
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="h-full">
              <div className="flex mb-4">
                <Button
                  variant={previewMode === 'rendered' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('rendered')}
                  className="mr-2"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button
                  variant={previewMode === 'source' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('source')}
                >
                  <Code className="h-4 w-4 mr-2" />
                  Source
                </Button>
              </div>

              {previewMode === 'rendered' && (
                <div className="h-[500px]">
                  {previewData?.content && getFileType(template.filePath) === 'HTML' ? (
                    <div className="border rounded-lg h-full overflow-hidden">
                      <iframe
                        srcDoc={previewData.content}
                        className="w-full h-full border-0"
                        title="Template Preview"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  ) : (
                    <div className="border rounded-lg h-full flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        {getFileTypeIcon(template.filePath)}
                        <p className="mt-2 text-sm text-gray-600">
                          Preview not available for {getFileType(template.filePath)} files
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Use the download button to view the file
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {previewMode === 'source' && (
                <div className="h-[500px]">
                  {previewData?.content && getFileType(template.filePath) === 'HTML' ? (
                    <div className="border rounded-lg h-full overflow-auto">
                      <pre className="p-4 text-sm bg-gray-50 h-full overflow-auto">
                        <code>{previewData.content}</code>
                      </pre>
                    </div>
                  ) : (
                    <div className="border rounded-lg h-full flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <Code className="h-8 w-8 mx-auto text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">
                          Source code not available for {getFileType(template.filePath)} files
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Binary files cannot be displayed as text
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-500">
            Created: {new Date(template.createdAt).toLocaleDateString()}
          </div>
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}