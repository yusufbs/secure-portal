import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskService } from '../../core/services/task.service';
import { ToastService } from '../../core/services/toast.service';
import { TaskDto, TaskItemStatus, TaskPriority } from '../../core/models/task.models';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css'
})
export class TasksComponent implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly TaskPriority = TaskPriority;
  readonly TaskItemStatus = TaskItemStatus;

  // Signals
  readonly tasks = signal<TaskDto[]>([]);
  readonly nextCursor = signal<string | undefined>(undefined);
  readonly hasNextPage = signal<boolean>(false);
  readonly isLoading = signal<boolean>(true);
  readonly isSubmitting = signal<boolean>(false);
  readonly showModal = signal<boolean>(false);

  readonly searchTerm = signal<string>('');
  readonly statusFilter = signal<string>('');
  readonly priorityFilter = signal<string>('');

  readonly taskForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: [''],
    priority: [TaskPriority.Medium],
    dueDate: ['']
  });

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(cursor?: string): void {
    this.isLoading.set(true);

    const statusVal = this.statusFilter() ? parseInt(this.statusFilter(), 10) : undefined;
    const priorityVal = this.priorityFilter() ? parseInt(this.priorityFilter(), 10) : undefined;

    this.taskService.getTasks({
      cursor,
      pageSize: 10,
      search: this.searchTerm(),
      status: statusVal,
      priority: priorityVal
    }).subscribe({
      next: result => {
        if (cursor) {
          this.tasks.update(current => [...current, ...result.items]);
        } else {
          this.tasks.set(result.items);
        }
        this.nextCursor.set(result.nextCursor);
        this.hasNextPage.set(result.hasNextPage);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadNextPage(): void {
    if (this.nextCursor()) {
      this.loadTasks(this.nextCursor());
    }
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
    this.loadTasks();
  }

  onStatusFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.statusFilter.set(select.value);
    this.loadTasks();
  }

  onPriorityFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.priorityFilter.set(select.value);
    this.loadTasks();
  }

  openCreateModal(): void {
    this.taskForm.reset({
      title: '',
      description: '',
      priority: TaskPriority.Medium,
      dueDate: ''
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  onCreateTask(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const val = this.taskForm.getRawValue();

    this.taskService.createTask({
      title: val.title,
      description: val.description || undefined,
      priority: val.priority,
      dueDateUtc: val.dueDate ? new Date(val.dueDate).toISOString() : undefined
    }).subscribe({
      next: created => {
        this.toast.showSuccess('Task Created', `"${created.title}" successfully added.`);
        this.closeModal();
        this.isSubmitting.set(false);
        this.loadTasks();
      },
      error: () => this.isSubmitting.set(false)
    });
  }

  markComplete(task: TaskDto): void {
    this.taskService.updateTask(task.id, {
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: TaskItemStatus.Completed,
      dueDateUtc: task.dueDateUtc,
      assignedToUserId: task.assignedToUserId
    }).subscribe({
      next: () => {
        this.toast.showSuccess('Task Completed', `"${task.title}" marked as completed.`);
        this.loadTasks();
      }
    });
  }

  deleteTask(id: string): void {
    if (!confirm('Are you sure you want to delete this task?')) return;

    this.taskService.deleteTask(id).subscribe({
      next: () => {
        this.toast.showInfo('Task Deleted', 'Task has been safely removed.');
        this.loadTasks();
      }
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
