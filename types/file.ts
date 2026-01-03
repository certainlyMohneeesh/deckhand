export interface FileMetadata {
  name: string;
  type: string;
  size: number;
  blobUrl: string;
  file: File;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export type AcceptedFileType = '.pdf' | '.pptx';
