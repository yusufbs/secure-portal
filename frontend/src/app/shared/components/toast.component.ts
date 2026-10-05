import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="toast-container" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="'toast-' + toast.type" role="alert">
          <div class="toast-content">
            <strong class="toast-title">{{ toast.title }}</strong>
            <p class="toast-message">{{ toast.message }}</p>
          </div>
          <button type="button" class="toast-close" (click)="toastService.remove(toast.id)" aria-label="Close">
            &times;
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 400px;
      width: 100%;
      pointer-events: none;
    }

    .toast {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border-radius: var(--radius-sm, 6px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
      animation: slideIn 0.25s ease-out;
      backdrop-filter: blur(10px);
    }

    .toast-success { background: #064e3b; border-left: 4px solid #10b981; color: #ecfdf5; }
    .toast-error { background: #4c0519; border-left: 4px solid #f43f5e; color: #fff1f2; }
    .toast-warning { background: #451a03; border-left: 4px solid #f59e0b; color: #fffbeb; }
    .toast-info { background: #082f49; border-left: 4px solid #0ea5e9; color: #f0f9ff; }

    .toast-title {
      display: block;
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 0.2rem;
    }

    .toast-message {
      font-size: 0.85rem;
      line-height: 1.4;
      margin: 0;
      opacity: 0.9;
    }

    .toast-close {
      background: none;
      border: none;
      color: inherit;
      font-size: 1.25rem;
      cursor: pointer;
      opacity: 0.7;
      padding: 0;
      line-height: 1;
    }

    .toast-close:hover { opacity: 1; }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
}
