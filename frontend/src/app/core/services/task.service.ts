import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateTaskRequest, PagedResult, TaskDto, UpdateTaskRequest } from '../models/task.models';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/tasks`;

  getTasks(options?: { cursor?: string; pageSize?: number; status?: number; priority?: number; search?: string }): Observable<PagedResult<TaskDto>> {
    let params = new HttpParams();

    if (options?.cursor) params = params.set('cursor', options.cursor);
    if (options?.pageSize) params = params.set('pageSize', options.pageSize.toString());
    if (options?.status !== undefined && options?.status !== null) params = params.set('status', options.status.toString());
    if (options?.priority !== undefined && options?.priority !== null) params = params.set('priority', options.priority.toString());
    if (options?.search) params = params.set('search', options.search.trim());

    return this.http.get<PagedResult<TaskDto>>(this.baseUrl, { params });
  }

  getTaskById(id: string): Observable<TaskDto> {
    return this.http.get<TaskDto>(`${this.baseUrl}/${id}`);
  }

  createTask(request: CreateTaskRequest): Observable<TaskDto> {
    return this.http.post<TaskDto>(this.baseUrl, request);
  }

  updateTask(id: string, request: UpdateTaskRequest): Observable<TaskDto> {
    return this.http.put<TaskDto>(`${this.baseUrl}/${id}`, request);
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
