import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();

  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const modifiedReq = req.clone({
    setHeaders: headers,
    withCredentials: true // Transmits secure cookies (__Host-access-token, XSRF-TOKEN)
  });

  return next(modifiedReq);
};
