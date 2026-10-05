import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuditEntryDto } from '../models/audit.models';
import { PagedResult } from '../models/task.models';

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/audit`;

  getAuditLogs(pageNumber = 1, pageSize = 20, entityName?: string, userId?: string): Observable<PagedResult<AuditEntryDto>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (entityName) params = params.set('entityName', entityName);
    if (userId) params = params.set('userId', userId);

    return this.http.get<PagedResult<AuditEntryDto>>(this.baseUrl, { params });
  }
}
