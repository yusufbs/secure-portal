import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ProblemDetails } from '../models/problem-details';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let title = 'Error';
      let message = 'An unexpected error occurred.';

      if (error.error && typeof error.error === 'object') {
        const problem = error.error as ProblemDetails;
        title = problem.title || `Error ${error.status}`;
        message = problem.detail || error.message;

        // Extract field validation details if present
        if (problem.errors && Object.keys(problem.errors).length > 0) {
          const firstKey = Object.keys(problem.errors)[0];
          message = problem.errors[firstKey]?.[0] || message;
        }
      } else if (typeof error.error === 'string') {
        message = error.error;
      }

      switch (error.status) {
        case 400:
          toast.showError(title, message);
          break;
        case 401:
          // Avoid duplicate alerts during initial authentication check
          if (!req.url.includes('/auth/me')) {
            toast.showWarning('Unauthorized', 'Your session has expired. Please sign in again.');
            router.navigate(['/login']);
          }
          break;
        case 403:
          toast.showError('Access Denied', 'You do not have permission to perform this action.');
          break;
        case 429:
          toast.showWarning('Rate Limit Exceeded', 'Too many requests. Please wait a moment before trying again.');
          break;
        case 0:
          toast.showError('Network Error', 'Unable to communicate with the secure server.');
          break;
        default:
          toast.showError(title, message);
          break;
      }

      return throwError(() => error);
    })
  );
};
