export enum TaskPriority {
  Low = 1,
  Medium = 2,
  High = 3,
  Critical = 4
}

export enum TaskItemStatus {
  Todo = 1,
  InProgress = 2,
  InReview = 3,
  Completed = 4,
  Cancelled = 5
}

export interface TaskDto {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskItemStatus;
  dueDateUtc?: string;
  assignedToUserId?: string;
  assignedToUsername?: string;
  createdAtUtc: string;
  createdBy?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDateUtc?: string;
  assignedToUserId?: string;
}

export interface UpdateTaskRequest {
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskItemStatus;
  dueDateUtc?: string;
  assignedToUserId?: string;
}

export interface PagedResult<T> {
  items: T[];
  nextCursor?: string;
  hasNextPage: boolean;
  pageSize: number;
  totalCount: number;
}
