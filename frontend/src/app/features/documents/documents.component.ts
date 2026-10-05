import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DocumentService } from '../../core/services/document.service';
import { ToastService } from '../../core/services/toast.service';
import { DocumentDto } from '../../core/models/document.models';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Secure Documents Vault</h1>
          <p class="page-subtitle">Cryptographically verified files with SHA-256 integrity tracking</p>
        </div>
      </div>

      <!-- Upload Dropzone Card -->
      <div class="card upload-card">
        <div class="dropzone" (dragover)="onDragOver($event)" (drop)="onDrop($event)">
          <div class="dropzone-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div class="dropzone-text">
            <p class="dropzone-title">Drag & drop your files here, or <label for="fileInput" class="browse-link">browse</label></p>
            <p class="dropzone-sub">Supported: PDF, DOCX, XLSX, Images, ZIP up to 25 MB. (Scripts and executables prohibited)</p>
          </div>
          <input
            id="fileInput"
            type="file"
            class="hidden-input"
            (change)="onFileSelected($event)"
          />
        </div>

        @if (isUploading()) {
          <div class="upload-progress">
            <div class="progress-bar">
              <div class="progress-fill"></div>
            </div>
            <span>Calculating SHA-256 hash & uploading securely...</span>
          </div>
        }
      </div>

      <!-- Documents Table Card -->
      <div class="card">
        <h2 class="section-title">Stored Documents</h2>

        @if (isLoading()) {
          <div class="state-container">Loading vault documents...</div>
        } @else if (documents().length === 0) {
          <div class="state-container">No documents uploaded to the vault yet.</div>
        } @else {
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>SHA-256 Hash</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (doc of documents(); track doc.id) {
                  <tr>
                    <td>
                      <strong>{{ doc.fileName }}</strong>
                    </td>
                    <td><span class="badge badge-medium">{{ doc.contentType }}</span></td>
                    <td>{{ formatFileSize(doc.fileSizeBytes) }}</td>
                    <td>
                      <code
                        class="hash-badge"
                        (click)="copyHash(doc.hashSha256)"
                        title="Click to copy full SHA-256 hash"
                      >
                        {{ doc.hashSha256.substring(0, 12) }}...
                      </code>
                    </td>
                    <td>{{ doc.createdAtUtc | date:'shortDate' }}</td>
                    <td>
                      <div class="actions-cell">
                        <button (click)="download(doc)" class="btn btn-secondary btn-sm" title="Download">
                          Download
                        </button>
                        <button (click)="delete(doc.id)" class="btn btn-danger btn-sm" title="Delete">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      margin-bottom: 1.5rem;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #fff;
    }

    .page-subtitle {
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .upload-card {
      margin-bottom: 2rem;
      padding: 2rem;
    }

    .dropzone {
      border: 2px dashed var(--border-color);
      border-radius: var(--radius-md);
      padding: 2.5rem 1.5rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      transition: all 0.2s ease;
      background: rgba(30, 41, 59, 0.4);
    }

    .dropzone:hover {
      border-color: var(--primary);
      background: rgba(79, 70, 229, 0.05);
    }

    .dropzone-icon {
      color: var(--primary);
    }

    .dropzone-title {
      font-size: 1rem;
      font-weight: 600;
      color: #fff;
      margin-bottom: 0.25rem;
    }

    .browse-link {
      color: #818cf8;
      cursor: pointer;
      text-decoration: underline;
    }

    .dropzone-sub {
      font-size: 0.8rem;
      color: var(--text-dim);
    }

    .hidden-input {
      display: none;
    }

    .upload-progress {
      margin-top: 1rem;
      text-align: center;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .progress-bar {
      height: 4px;
      background: var(--border-color);
      border-radius: 9999px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }

    .progress-fill {
      height: 100%;
      background: var(--primary);
      width: 100%;
      animation: progressPulse 1.2s infinite ease-in-out;
    }

    @keyframes progressPulse {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    .section-title {
      font-size: 1.15rem;
      font-weight: 600;
      color: #fff;
      margin-bottom: 1.25rem;
    }

    .hash-badge {
      background: #1e293b;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.8rem;
      color: #38bdf8;
      cursor: pointer;
      border: 1px solid #334155;
    }

    .hash-badge:hover {
      background: #334155;
    }

    .actions-cell {
      display: flex;
      gap: 0.5rem;
    }

    .state-container {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-muted);
    }
  `]
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
    if (event.dataTransfer?.files?.length) {
      this.handleFile(event.dataTransfer.files[0]);
    }
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
