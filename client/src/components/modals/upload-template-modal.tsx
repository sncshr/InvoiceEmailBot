import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const uploadSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  version: z.string().min(1, "Version is required").default("1.0"),
  file: z.any().refine(
    (files) => files?.length === 1,
    "Please select a file to upload"
  ),
});

type UploadFormData = z.infer<typeof uploadSchema>;

export function UploadTemplateModal({ open, onOpenChange }: UploadTemplateModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      name: "",
      version: "1.0",
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: UploadFormData) => {
      const formData = new FormData();
      formData.append('template', data.file[0]);
      formData.append('name', data.name);
      formData.append('version', data.version);

      const response = await fetch('/api/templates/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Template Uploaded",
        description: `${data.template.name} has been uploaded successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      onOpenChange(false);
      form.reset();
      setSelectedFile(null);
      setUploadProgress(0);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const onSubmit = (data: UploadFormData) => {
    setUploadProgress(50);
    uploadMutation.mutate(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill name if empty
      if (!form.getValues("name")) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        form.setValue("name", nameWithoutExt);
      }
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'docx':
        return <FileText className="h-8 w-8 text-blue-500" />;
      case 'html':
      case 'htm':
        return <FileText className="h-8 w-8 text-orange-500" />;
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      default:
        return <FileText className="h-8 w-8 text-gray-500" />;
    }
  };

  const isValidFileType = (fileName: string) => {
    const validExtensions = ['docx'];
    const ext = fileName.split('.').pop()?.toLowerCase();
    return validExtensions.includes(ext || '');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Template</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter template name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="version"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Version</FormLabel>
                  <FormControl>
                    <Input placeholder="1.0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template File</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <Input
                        type="file"
                        accept=".docx"
                        onChange={(e) => {
                          field.onChange(e.target.files);
                          handleFileChange(e);
                        }}
                        className="cursor-pointer"
                      />
                      
                      {selectedFile && (
                        <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                          {getFileIcon(selectedFile.name)}
                          <div className="flex-1">
                            <p className="font-medium text-sm">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          {isValidFileType(selectedFile.name) ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                      )}

                      <div className="text-xs text-gray-500">
                        Supported formats: DOCX only (max 5MB)
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {uploadMutation.isPending && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 text-center">Uploading template...</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={uploadMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-500 hover:bg-blue-600"
                disabled={uploadMutation.isPending || !selectedFile}
              >
                {uploadMutation.isPending ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Template
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}