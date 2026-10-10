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
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
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
