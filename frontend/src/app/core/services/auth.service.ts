import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, UserProfile } from '../models/auth.models';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  // Signals State
  readonly currentUser = signal<UserProfile | null>(null);
  readonly token = signal<string | null>(this.getStoredToken());
  readonly isInitialized = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);

  // Computed Selectors
  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly isAdmin = computed(() => this.currentUser()?.roles?.includes('Admin') ?? false);
  readonly isManager = computed(() => {
    const roles = this.currentUser()?.roles ?? [];
    return roles.includes('Admin') || roles.includes('Manager');
  });

  constructor() {
    this.initAuth();
  }

  private initAuth(): void {
    const savedToken = this.token();
    if (savedToken) {
      this.http.get<UserProfile>(`${this.baseUrl}/me`, { withCredentials: true })
        .pipe(
          catchError(() => {
            this.clearSession();
            return of(null);
          })
        )
        .subscribe(user => {
          if (user) {
            this.currentUser.set(user);
          }
          this.isInitialized.set(true);
        });
    } else {
      this.isInitialized.set(true);
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    this.isLoading.set(true);
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, credentials, { withCredentials: true })
      .pipe(
        tap(res => {
          this.setSession(res);
          this.toast.showSuccess('Welcome Back', `Logged in as ${res.user.firstName} (${res.user.username})`);
          this.router.navigate(['/dashboard']);
        }),
        tap({ finalize: () => this.isLoading.set(false) })
      );
  }

  register(payload: RegisterRequest): Observable<AuthResponse> {
    this.isLoading.set(true);
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, payload, { withCredentials: true })
      .pipe(
        tap(res => {
          this.setSession(res);
          this.toast.showSuccess('Account Created', 'Registration completed successfully.');
          this.router.navigate(['/dashboard']);
        }),
        tap({ finalize: () => this.isLoading.set(false) })
      );
  }

  logout(): void {
    this.http.post(`${this.baseUrl}/logout`, {}, { withCredentials: true })
      .pipe(
        catchError(() => of(null))
      )
      .subscribe(() => {
        this.clearSession();
        this.toast.showInfo('Logged Out', 'You have been safely signed out.');
        this.router.navigate(['/login']);
      });
  }

  private setSession(authResponse: AuthResponse): void {
    this.currentUser.set(authResponse.user);
    this.token.set(authResponse.accessToken);
    try {
      localStorage.setItem('auth_token', authResponse.accessToken);
    } catch {
      // Storage unavailable fallback
    }
  }

  private clearSession(): void {
    this.currentUser.set(null);
    this.token.set(null);
    try {
      localStorage.removeItem('auth_token');
    } catch {
      // Fallback
    }
  }

  private getStoredToken(): string | null {
    try {
      return localStorage.getItem('auth_token');
    } catch {
      return null;
    }
  }
}
