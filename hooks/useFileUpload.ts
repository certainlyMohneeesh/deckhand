import { useState, useCallback } from 'react';
import { FileMetadata, UploadProgress } from '@/types/file';
import { toast } from 'sonner';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
];

export const useFileUpload = () => {
  const [file, setFile] = useState<FileMetadata | null>(null);
  const [progress, setProgress] = useState<UploadProgress>({ loaded: 0, total: 0, percentage: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload a PDF or PPTX file.';
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 50MB limit. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`;
    }

    return null;
  }, []);

  const uploadFile = useCallback(async (selectedFile: File) => {
    setError(null);
    setIsUploading(true);

    // Validate file
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      setIsUploading(false);
      toast.error(validationError);
      return null;
    }

    try {
      // Simulate upload progress (in real app, this would be actual upload)
      const simulateProgress = () => {
        return new Promise<void>((resolve) => {
          let loaded = 0;
          const total = selectedFile.size;
          const interval = setInterval(() => {
            loaded += total / 20; // 20 steps
            if (loaded >= total) {
              loaded = total;
              clearInterval(interval);
              resolve();
            }
            setProgress({
              loaded,
              total,
              percentage: Math.round((loaded / total) * 100),
            });
          }, 50);
        });
      };

      await simulateProgress();

      // Create blob URL and file metadata
      const blobUrl = URL.createObjectURL(selectedFile);
      const metadata: FileMetadata = {
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
        blobUrl,
        file: selectedFile,
      };

      setFile(metadata);
      setIsUploading(false);
      toast.success(`${selectedFile.name} uploaded successfully!`);
      return metadata;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      setIsUploading(false);
      toast.error(errorMessage);
      return null;
    }
  }, [validateFile]);

  const clearFile = useCallback(() => {
    if (file?.blobUrl) {
      URL.revokeObjectURL(file.blobUrl);
    }
    setFile(null);
    setProgress({ loaded: 0, total: 0, percentage: 0 });
    setError(null);
  }, [file]);

  return {
    file,
    progress,
    isUploading,
    error,
    uploadFile,
    clearFile,
    validateFile,
  };
};
