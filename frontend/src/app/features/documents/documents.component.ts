import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DocumentService } from '../../core/services/document.service';
import { ToastService } from '../../core/services/toast.service';
import { DocumentDto } from '../../core/models/document.models';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.css'
})
export class DocumentsComponent implements OnInit {
  private readonly documentService = inject(DocumentService);
  private readonly toast = inject(ToastService);

  readonly documents = signal<DocumentDto[]>([]);
  readonly isLoading = signal(true);
  readonly isUploading = signal(false);

  private readonly blockedExtensions = ['.exe', '.dll', '.bat', '.cmd', '.ps1', '.sh', '.msi'];

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.isLoading.set(true);
    this.documentService.getDocuments().subscribe({
      next: docs => {
        this.documents.set(docs);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.handleFile(input.files[0]);
      input.value = '';
    }
  }

  private handleFile(file: File): void {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (this.blockedExtensions.includes(ext)) {
      this.toast.showError('Prohibited File', `Files with extension ${ext} are blocked for security.`);
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      this.toast.showError('File Too Large', 'Maximum allowed file size is 25 MB.');
      return;
    }

    this.isUploading.set(true);
    this.documentService.uploadDocument(file).subscribe({
      next: doc => {
        this.toast.showSuccess('Upload Complete', `"${doc.fileName}" verified and stored.`);
        this.isUploading.set(false);
        this.loadDocuments();
      },
      error: () => this.isUploading.set(false)
    });
  }

  download(doc: DocumentDto): void {
    this.documentService.downloadDocument(doc.id, doc.fileName).subscribe();
  }

  delete(id: string): void {
    if (!confirm('Are you sure you want to delete this document?')) return;

    this.documentService.deleteDocument(id).subscribe({
      next: () => {
        this.toast.showInfo('Document Deleted', 'Document safely removed from vault.');
        this.loadDocuments();
      }
    });
  }

  copyHash(hash: string): void {
    navigator.clipboard.writeText(hash).then(() => {
      this.toast.showInfo('Hash Copied', 'Full SHA-256 checksum copied to clipboard.');
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
