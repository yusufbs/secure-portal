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
  template: `
    <div class="container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Tasks Management</h1>
          <p class="page-subtitle">Track, filter, and assign work with keyset pagination & multi-tier cache</p>
        </div>
        <button (click)="openCreateModal()" class="btn btn-primary">+ Create Task</button>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="card toolbar-card">
        <div class="toolbar">
          <div class="search-box">
            <input
              type="text"
              class="form-control"
              placeholder="Search tasks..."
              [value]="searchTerm()"
              (input)="onSearchChange($event)"
            />
          </div>

          <div class="filter-group">
            <select class="form-control" [value]="statusFilter()" (change)="onStatusFilterChange($event)">
              <option value="">All Statuses</option>
              <option [value]="TaskItemStatus.Todo">To Do</option>
              <option [value]="TaskItemStatus.InProgress">In Progress</option>
              <option [value]="TaskItemStatus.InReview">In Review</option>
              <option [value]="TaskItemStatus.Completed">Completed</option>
            </select>

            <select class="form-control" [value]="priorityFilter()" (change)="onPriorityFilterChange($event)">
              <option value="">All Priorities</option>
              <option [value]="TaskPriority.Low">Low</option>
              <option [value]="TaskPriority.Medium">Medium</option>
              <option [value]="TaskPriority.High">High</option>
              <option [value]="TaskPriority.Critical">Critical</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Tasks List Table -->
      <div class="card">
        @if (isLoading() && tasks().length === 0) {
          <div class="state-container">Loading tasks from secure cache...</div>
        } @else if (tasks().length === 0) {
          <div class="state-container">
            <p>No tasks match the selected criteria.</p>
          </div>
        } @else {
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Assignee</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (task of tasks(); track task.id) {
                  <tr>
                    <td>
                      <div class="task-cell">
                        <span class="task-title">{{ task.title }}</span>
                        @if (task.description) {
                          <span class="task-desc">{{ task.description }}</span>
                        }
                      </div>
                    </td>
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
                    <td>{{ task.dueDateUtc ? (task.dueDateUtc | date:'mediumDate') : '—' }}</td>
                    <td>{{ task.assignedToUsername || 'Unassigned' }}</td>
                    <td>
                      <div class="actions-cell">
                        @if (task.status !== TaskItemStatus.Completed) {
                          <button (click)="markComplete(task)" class="btn btn-secondary btn-sm" title="Mark Complete">
                            ✓
                          </button>
                        }
                        <button (click)="deleteTask(task.id)" class="btn btn-danger btn-sm" title="Delete Task">
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Keyset Pagination Controls -->
          @if (hasNextPage()) {
            <div class="pagination-footer">
              <button
                (click)="loadNextPage()"
                class="btn btn-secondary"
                [disabled]="isLoading()"
              >
                @if (isLoading()) {
                  <span>Loading next page...</span>
                } @else {
                  <span>Load More Tasks &darr;</span>
                }
              </button>
            </div>
          }
        }
      </div>

      <!-- Create Task Modal Dialog -->
      @if (showModal()) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Create New Task</h3>
              <button (click)="closeModal()" class="modal-close">&times;</button>
            </div>

            <form [formGroup]="taskForm" (ngSubmit)="onCreateTask()">
              <div class="form-group">
                <label class="form-label" for="taskTitle">Task Title *</label>
                <input
                  id="taskTitle"
                  type="text"
                  class="form-control"
                  formControlName="title"
                  placeholder="e.g. Conduct Code Vulnerability Review"
                />
                @if (taskForm.controls.title.touched && taskForm.controls.title.invalid) {
                  <div class="form-error">Title is required (max 200 chars).</div>
                }
              </div>

              <div class="form-group">
                <label class="form-label" for="taskDescription">Description</label>
                <textarea
                  id="taskDescription"
                  class="form-control"
                  rows="3"
                  formControlName="description"
                  placeholder="Provide task specifications and criteria..."
                ></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="taskPriority">Priority</label>
                  <select id="taskPriority" class="form-control" formControlName="priority">
                    <option [value]="TaskPriority.Low">Low</option>
                    <option [value]="TaskPriority.Medium">Medium</option>
                    <option [value]="TaskPriority.High">High</option>
                    <option [value]="TaskPriority.Critical">Critical</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label" for="taskDueDate">Due Date</label>
                  <input
                    id="taskDueDate"
                    type="date"
                    class="form-control"
                    formControlName="dueDate"
                  />
                </div>
              </div>

              <div class="modal-actions">
                <button type="button" (click)="closeModal()" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="taskForm.invalid || isSubmitting()">
                  {{ isSubmitting() ? 'Saving...' : 'Create Task' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
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
    }

    .toolbar-card {
      margin-bottom: 1.5rem;
      padding: 1rem;
    }

    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .search-box {
      flex: 1;
      min-width: 250px;
    }

    .filter-group {
      display: flex;
      gap: 0.75rem;
    }

    .task-cell {
      display: flex;
      flex-direction: column;
    }

    .task-title {
      font-weight: 600;
      color: #fff;
    }

    .task-desc {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 0.15rem;
    }

    .actions-cell {
      display: flex;
      gap: 0.4rem;
    }

    .pagination-footer {
      display: flex;
      justify-content: center;
      padding: 1.25rem 0 0.5rem;
    }

    .state-container {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-muted);
    }

    /* Modal styling */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      z-index: 200;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .modal {
      max-width: 550px;
      width: 100%;
      border-radius: var(--radius-md);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }

    .modal-close {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 1.5rem;
      cursor: pointer;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }
  `]
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
