import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuditService } from '../../core/services/audit.service';
import { AuditEntryDto } from '../../core/models/audit.models';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Compliance Audit Trail</h1>
          <p class="page-subtitle">Immutable chronological change log with sensitive credential redaction</p>
        </div>
      </div>

      <div class="card toolbar-card">
        <div class="toolbar">
          <input
            type="text"
            class="form-control"
            placeholder="Filter by entity name (e.g. TaskItem, User, Document)..."
            [value]="entityFilter()"
            (input)="onEntityFilterChange($event)"
          />
        </div>
      </div>

      <div class="card">
        @if (isLoading()) {
          <div class="state-container">Loading compliance logs...</div>
        } @else if (auditLogs().length === 0) {
          <div class="state-container">No audit events found.</div>
        } @else {
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Target ID</th>
                  <th>Caller IP</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                @for (entry of auditLogs(); track entry.id) {
                  <tr>
                    <td>{{ entry.timestampUtc | date:'medium' }}</td>
                    <td>
                      <span class="badge" [class]="getActionBadgeClass(entry.action)">
                        {{ entry.action }}
                      </span>
                    </td>
                    <td><strong>{{ entry.entityName }}</strong></td>
                    <td><code>{{ entry.entityId.substring(0, 8) }}...</code></td>
                    <td>{{ entry.clientIpAddress || 'Internal' }}</td>
                    <td>
                      <button (click)="viewDetails(entry)" class="btn btn-secondary btn-sm">
                        Inspect
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="pagination-bar">
            <span>Total records: {{ totalCount() }}</span>
            <div class="page-buttons">
              <button
                class="btn btn-secondary btn-sm"
                [disabled]="pageNumber() <= 1"
                (click)="changePage(pageNumber() - 1)"
              >
                Previous
              </button>
              <span class="page-indicator">Page {{ pageNumber() }}</span>
              <button
                class="btn btn-secondary btn-sm"
                [disabled]="auditLogs().length < pageSize()"
                (click)="changePage(pageNumber() + 1)"
              >
                Next
              </button>
            </div>
          </div>
        }
      </div>

      <!-- JSON Diff Inspection Modal -->
      @if (selectedEntry()) {
        <div class="modal-backdrop" (click)="closeDetails()">
          <div class="modal card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Audit Event Details</h3>
              <button (click)="closeDetails()" class="modal-close">&times;</button>
            </div>

            <div class="modal-body">
              <div class="diff-section">
                <h4>Changed Columns</h4>
                <code>{{ selectedEntry()?.changedColumnsJson || 'None' }}</code>
              </div>

              @if (selectedEntry()?.oldValuesJson) {
                <div class="diff-section">
                  <h4>Old Values</h4>
                  <pre class="json-box">{{ formatJson(selectedEntry()?.oldValuesJson) }}</pre>
                </div>
              }

              @if (selectedEntry()?.newValuesJson) {
                <div class="diff-section">
                  <h4>New Values</h4>
                  <pre class="json-box">{{ formatJson(selectedEntry()?.newValuesJson) }}</pre>
                </div>
              }
            </div>
          </div>
        </div>
      }
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

    .toolbar-card {
      margin-bottom: 1.5rem;
      padding: 1rem;
    }

    .pagination-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 1.25rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .page-buttons {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .page-indicator {
      font-weight: 600;
      color: #fff;
    }

    .state-container {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-muted);
    }

    /* Modal */
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
      max-width: 650px;
      width: 100%;
      border-radius: var(--radius-md);
      max-height: 85vh;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .modal-close {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 1.5rem;
      cursor: pointer;
    }

    .modal-body {
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .diff-section h4 {
      font-size: 0.85rem;
      color: var(--text-dim);
      margin-bottom: 0.35rem;
    }

    .json-box {
      background: #0f172a;
      border: 1px solid var(--border-color);
      padding: 0.75rem;
      border-radius: var(--radius-sm);
      font-family: monospace;
      font-size: 0.8rem;
      color: #38bdf8;
      overflow-x: auto;
      white-space: pre-wrap;
    }
  `]
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
