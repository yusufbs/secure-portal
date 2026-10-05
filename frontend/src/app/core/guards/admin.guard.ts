import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  if (authService.isAdmin()) {
    return true;
  }

  toast.showError('Access Denied', 'Administrator privileges are required.');
  router.navigate(['/dashboard']);
  return false;
};
