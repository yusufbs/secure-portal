import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DocumentDto } from '../models/document.models';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/documents`;

  getDocuments(): Observable<DocumentDto[]> {
    return this.http.get<DocumentDto[]>(this.baseUrl);
  }

  uploadDocument(file: File): Observable<DocumentDto> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post<DocumentDto>(`${this.baseUrl}/upload`, formData);
  }

  downloadDocument(id: string, fileName: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/download`, { responseType: 'blob' })
      .pipe(
        tap(blob => {
          const url = window.URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = fileName;
          anchor.click();
          window.URL.revokeObjectURL(url);
        })
      );
  }

  deleteDocument(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
