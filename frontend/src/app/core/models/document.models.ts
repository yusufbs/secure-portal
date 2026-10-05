export interface DocumentDto {
  id: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  hashSha256: string;
  createdAtUtc: string;
  createdBy?: string;
}
