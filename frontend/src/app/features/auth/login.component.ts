import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="card auth-card">
        <div class="auth-header">
          <h1 class="auth-title">Welcome to SecurePortal</h1>
          <p class="auth-subtitle">Sign in to your account with enterprise security</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label" for="usernameOrEmail">Username or Email</label>
            <input
              id="usernameOrEmail"
              type="text"
              class="form-control"
              formControlName="usernameOrEmail"
              placeholder="e.g. admin or admin@secureportal.local"
              autocomplete="username"
            />
            @if (form.controls.usernameOrEmail.touched && form.controls.usernameOrEmail.invalid) {
              <div class="form-error">Username or email is required.</div>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input
              id="password"
              type="password"
              class="form-control"
              formControlName="password"
              placeholder="••••••••••••"
              autocomplete="current-password"
            />
            @if (form.controls.password.touched && form.controls.password.invalid) {
              <div class="form-error">Password is required.</div>
            }
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-block"
            [disabled]="form.invalid || authService.isLoading()"
          >
            @if (authService.isLoading()) {
              <span>Signing in...</span>
            } @else {
              <span>Sign In</span>
            }
          </button>
        </form>

        <div class="auth-footer">
          <p>Don't have an account? <a routerLink="/register">Register here</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: calc(100vh - 120px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
    }

    .auth-card {
      max-width: 440px;
      width: 100%;
      border-radius: var(--radius-lg);
    }

    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .auth-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 0.5rem;
    }

    .auth-subtitle {
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .btn-block {
      width: 100%;
      padding: 0.75rem;
      margin-top: 1rem;
    }

    .auth-footer {
      text-align: center;
      margin-top: 1.75rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border-color);
      font-size: 0.875rem;
      color: var(--text-muted);
    }
  `]
})
export class LoginComponent {
  readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    usernameOrEmail: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.authService.login(this.form.getRawValue()).subscribe();
  }
}
