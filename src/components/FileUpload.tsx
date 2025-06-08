
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
}

export const FileUpload = ({ onFileUpload }: FileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.name.endsWith('.csv'));
    
    if (csvFile) {
      onFileUpload(csvFile);
      toast({
        title: "File uploaded successfully",
        description: `Processing ${csvFile.name}...`,
      });
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      toast({
        title: "File uploaded successfully",
        description: `Processing ${file.name}...`,
      });
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <Button
        onClick={() => fileInputRef.current?.click()}
        className="bg-blue-600 hover:bg-blue-700"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <Upload className="h-4 w-4 mr-2" />
        Upload CSV
      </Button>
      
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-100 border-2 border-dashed border-blue-400 rounded-md flex items-center justify-center">
          <FileText className="h-6 w-6 text-blue-600" />
        </div>
      )}
    </div>
  );
};
