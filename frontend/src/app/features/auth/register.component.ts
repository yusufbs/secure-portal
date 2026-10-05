import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="card auth-card">
        <div class="auth-header">
          <h1 class="auth-title">Create an Account</h1>
          <p class="auth-subtitle">Join the secure enterprise portal</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="firstName">First Name</label>
              <input id="firstName" type="text" class="form-control" formControlName="firstName" placeholder="John" />
              @if (form.controls.firstName.touched && form.controls.firstName.invalid) {
                <div class="form-error">Required</div>
              }
            </div>

            <div class="form-group">
              <label class="form-label" for="lastName">Last Name</label>
              <input id="lastName" type="text" class="form-control" formControlName="lastName" placeholder="Doe" />
              @if (form.controls.lastName.touched && form.controls.lastName.invalid) {
                <div class="form-error">Required</div>
              }
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="username">Username</label>
            <input id="username" type="text" class="form-control" formControlName="username" placeholder="johndoe" autocomplete="username" />
            @if (form.controls.username.touched && form.controls.username.invalid) {
              <div class="form-error">3-50 alphanumeric characters required.</div>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="email">Work Email</label>
            <input id="email" type="email" class="form-control" formControlName="email" placeholder="john.doe@company.com" autocomplete="email" />
            @if (form.controls.email.touched && form.controls.email.invalid) {
              <div class="form-error">Valid email address required.</div>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input id="password" type="password" class="form-control" formControlName="password" placeholder="••••••••••••" autocomplete="new-password" />
            @if (form.controls.password.touched && form.controls.password.invalid) {
              <div class="form-error">Must be 8+ chars with uppercase, number & symbol.</div>
            }
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-block"
            [disabled]="form.invalid || authService.isLoading()"
          >
            @if (authService.isLoading()) {
              <span>Creating account...</span>
            } @else {
              <span>Complete Registration</span>
            }
          </button>
        </form>

        <div class="auth-footer">
          <p>Already have an account? <a routerLink="/login">Sign in</a></p>
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
      max-width: 500px;
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

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
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
export class RegisterComponent {
  readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern('^[a-zA-Z0-9_]+$')]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z\\d]).{8,}$')]],
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]]
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.authService.register(this.form.getRawValue()).subscribe();
  }
}
