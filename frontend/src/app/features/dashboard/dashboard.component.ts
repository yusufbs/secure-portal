import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TaskService } from '../../core/services/task.service';
import { DocumentService } from '../../core/services/document.service';
import { TaskDto, TaskItemStatus } from '../../core/models/task.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="container">
      <div class="dashboard-header">
        <div>
          <h1 class="page-title">Welcome, {{ authService.currentUser()?.firstName }}</h1>
          <p class="page-subtitle">Security posture is active • Session secured with HttpOnly cookies & RBAC</p>
        </div>
        <div class="header-actions">
          <a routerLink="/tasks" class="btn btn-primary btn-sm">+ New Task</a>
          <a routerLink="/documents" class="btn btn-secondary btn-sm">Upload File</a>
        </div>
      </div>

      <!-- Metric Stats Cards -->
      <div class="grid-4 stats-grid">
        <div class="card stat-card">
          <span class="stat-label">Total Tasks</span>
          <span class="stat-value">{{ totalTasks() }}</span>
          <span class="stat-sub text-muted">Across all workflows</span>
        </div>

        <div class="card stat-card">
          <span class="stat-label">Tasks In Progress</span>
          <span class="stat-value text-indigo">{{ inProgressTasks() }}</span>
          <span class="stat-sub text-muted">Active execution</span>
        </div>

        <div class="card stat-card">
          <span class="stat-label">Completed Tasks</span>
          <span class="stat-value text-green">{{ completedTasks() }}</span>
          <span class="stat-sub text-muted">Successfully finalized</span>
        </div>

        <div class="card stat-card">
          <span class="stat-label">Secure Documents</span>
          <span class="stat-value text-sky">{{ totalDocuments() }}</span>
          <span class="stat-sub text-muted">SHA-256 verified</span>
        </div>
      </div>

      <!-- Recent Tasks Section -->
      <div class="card section-card">
        <div class="section-header">
          <h2 class="section-title">Recent Tasks</h2>
          <a routerLink="/tasks" class="view-all-link">View All &rarr;</a>
        </div>

        @if (isLoading()) {
          <div class="loading-state">Loading tasks...</div>
        } @else if (recentTasks().length === 0) {
          <div class="empty-state">
            <p>No tasks created yet.</p>
            <a routerLink="/tasks" class="btn btn-primary btn-sm">Create First Task</a>
          </div>
        } @else {
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                @for (task of recentTasks(); track task.id) {
                  <tr>
                    <td><strong>{{ task.title }}</strong></td>
                    <td>
                      <span class="badge" [class]="getPriorityClass(task.priority)">
                        {{ getPriorityName(task.priority) }}
                      </span>
                    </td>
                    <td>
                      <span class="badge" [class]="getStatusClass(task.status)">
                        {{ getStatusName(task.status) }}
                      </span>
                    </td>
                    <td>{{ task.createdAtUtc | date:'shortDate' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Deferrable View: Security & System Architecture Panel -->
      @defer (on viewport) {
        <div class="card telemetry-card">
          <h3 class="telemetry-title">Security & Runtime Telemetry</h3>
          <div class="grid-3 telemetry-grid">
            <div class="telemetry-item">
              <span class="telemetry-label">Session Protection</span>
              <span class="telemetry-status">Active (SameSite=Strict, HttpOnly)</span>
            </div>
            <div class="telemetry-item">
              <span class="telemetry-label">Data Protection API</span>
              <span class="telemetry-status">Persisted in SQL Server</span>
            </div>
            <div class="telemetry-item">
              <span class="telemetry-label">Rate Limiter</span>
              <span class="telemetry-status">Sliding Window Partitioned</span>
            </div>
          </div>
        </div>
      } @placeholder {
        <div class="card telemetry-placeholder">Loading security telemetry...</div>
      }
    </div>
  `,
  styles: [`
    .dashboard-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2rem;
      gap: 1rem;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #fff;
    }

    .page-subtitle {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin-top: 0.25rem;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .stats-grid {
      margin-bottom: 2rem;
    }

    .stat-card {
      display: flex;
      flex-direction: column;
    }

    .stat-label {
      font-size: 0.825rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-dim);
    }

    .stat-value {
      font-size: 2.2rem;
      font-weight: 800;
      color: #fff;
      margin: 0.25rem 0;
    }

    .stat-sub {
      font-size: 0.8rem;
    }

    .text-indigo { color: #818cf8; }
    .text-green { color: #34d399; }
    .text-sky { color: #38bdf8; }

    .section-card {
      margin-bottom: 2rem;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
    }

    .section-title {
      font-size: 1.15rem;
      font-weight: 600;
      color: #fff;
    }

    .view-all-link {
      font-size: 0.875rem;
      font-weight: 600;
    }

    .empty-state, .loading-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-muted);
    }

    .telemetry-card {
      background: #0f172a;
      border: 1px solid #1e293b;
    }

    .telemetry-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }

    .telemetry-grid {
      gap: 1rem;
    }

    .telemetry-item {
      background: #1e293b;
      padding: 1rem;
      border-radius: var(--radius-sm);
    }

    .telemetry-label {
      display: block;
      font-size: 0.8rem;
      color: var(--text-dim);
      margin-bottom: 0.25rem;
    }

    .telemetry-status {
      font-size: 0.9rem;
      font-weight: 600;
      color: #10b981;
    }

    .telemetry-placeholder {
      padding: 2rem;
      text-align: center;
      color: var(--text-dim);
    }
  `]
})
export class DashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly taskService = inject(TaskService);
  private readonly documentService = inject(DocumentService);

  readonly totalTasks = signal(0);
  readonly inProgressTasks = signal(0);
  readonly completedTasks = signal(0);
  readonly totalDocuments = signal(0);
  readonly recentTasks = signal<TaskDto[]>([]);
  readonly isLoading = signal(true);

  ngOnInit(): void {
    this.loadMetrics();
  }

  private loadMetrics(): void {
    this.taskService.getTasks({ pageSize: 5 }).subscribe({
      next: res => {
        this.totalTasks.set(res.totalCount);
        this.recentTasks.set(res.items);
        this.inProgressTasks.set(res.items.filter(t => t.status === TaskItemStatus.InProgress).length);
        this.completedTasks.set(res.items.filter(t => t.status === TaskItemStatus.Completed).length);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });

    this.documentService.getDocuments().subscribe({
      next: docs => this.totalDocuments.set(docs.length)
    });
  }

  getPriorityName(priority: number): string {
    switch (priority) {
      case 1: return 'Low';
      case 2: return 'Medium';
      case 3: return 'High';
      case 4: return 'Critical';
      default: return 'Medium';
    }
  }

  getPriorityClass(priority: number): string {
    switch (priority) {
      case 1: return 'badge-low';
      case 2: return 'badge-medium';
      case 3: return 'badge-high';
      case 4: return 'badge-critical';
      default: return 'badge-medium';
    }
  }

  getStatusName(status: number): string {
    switch (status) {
      case 1: return 'To Do';
      case 2: return 'In Progress';
      case 3: return 'In Review';
      case 4: return 'Completed';
      case 5: return 'Cancelled';
      default: return 'To Do';
    }
  }

  getStatusClass(status: number): string {
    switch (status) {
      case 1: return 'badge-todo';
      case 2: return 'badge-in-progress';
      case 4: return 'badge-completed';
      default: return 'badge-todo';
    }
  }
}
