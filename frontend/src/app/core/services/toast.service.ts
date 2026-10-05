import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  readonly toasts = signal<ToastMessage[]>([]);

  show(type: ToastType, title: string, message: string, durationMs = 5000): void {
    const id = crypto.randomUUID();
    const newToast: ToastMessage = { id, type, title, message };

    this.toasts.update(current => [...current, newToast]);

    if (durationMs > 0) {
      setTimeout(() => {
        this.remove(id);
      }, durationMs);
    }
  }

  showSuccess(title: string, message: string): void {
    this.show('success', title, message);
  }

  showError(title: string, message: string): void {
    this.show('error', title, message, 7000);
  }

  showWarning(title: string, message: string): void {
    this.show('warning', title, message);
  }

  showInfo(title: string, message: string): void {
    this.show('info', title, message);
  }

  remove(id: string): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
