import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuditService } from '../../core/services/audit.service';
import { AuditEntryDto } from '../../core/models/audit.models';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './audit.component.html',
  styleUrl: './audit.component.css'
})
export class AuditComponent implements OnInit {
  private readonly auditService = inject(AuditService);

  readonly auditLogs = signal<AuditEntryDto[]>([]);
  readonly totalCount = signal(0);
  readonly pageNumber = signal(1);
  readonly pageSize = signal(15);
  readonly entityFilter = signal('');
  readonly isLoading = signal(true);
  readonly selectedEntry = signal<AuditEntryDto | null>(null);

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.isLoading.set(true);
    this.auditService.getAuditLogs(
      this.pageNumber(),
      this.pageSize(),
      this.entityFilter() || undefined
    ).subscribe({
      next: result => {
        this.auditLogs.set(result.items);
        this.totalCount.set(result.totalCount);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  changePage(newPage: number): void {
    this.pageNumber.set(newPage);
    this.loadLogs();
  }

  onEntityFilterChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.entityFilter.set(input.value);
    this.pageNumber.set(1);
    this.loadLogs();
  }

  viewDetails(entry: AuditEntryDto): void {
    this.selectedEntry.set(entry);
  }

  closeDetails(): void {
    this.selectedEntry.set(null);
  }

  formatJson(rawJson?: string): string {
    if (!rawJson) return '';
    try {
      return JSON.stringify(JSON.parse(rawJson), null, 2);
    } catch {
      return rawJson;
    }
  }

  getActionBadgeClass(action: string): string {
    switch (action.toLowerCase()) {
      case 'added': return 'badge-completed';
      case 'modified': return 'badge-in-progress';
      case 'deleted': return 'badge-critical';
      default: return 'badge-todo';
    }
  }
}
