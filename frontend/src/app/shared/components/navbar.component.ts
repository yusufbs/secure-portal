import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="navbar">
      <div class="navbar-content">
        <a routerLink="/" class="navbar-brand">
          <div class="brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <span>SecurePortal</span>
        </a>

        @if (authService.isAuthenticated()) {
          <nav class="nav-links">
            <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">Dashboard</a>
            <a routerLink="/tasks" routerLinkActive="active" class="nav-link">Tasks</a>
            <a routerLink="/documents" routerLinkActive="active" class="nav-link">Documents</a>
            @if (authService.isAdmin()) {
              <a routerLink="/audit" routerLinkActive="active" class="nav-link">Audit Trail</a>
            }
          </nav>

          <div class="nav-user">
            <div class="user-badge">
              <span class="user-name">{{ authService.currentUser()?.firstName }}</span>
              <span class="badge badge-admin">{{ authService.currentUser()?.roles?.[0] }}</span>
            </div>
            <button (click)="authService.logout()" class="btn btn-secondary btn-sm">
              Sign Out
            </button>
          </div>
        } @else {
          <div class="nav-actions">
            <a routerLink="/login" class="btn btn-secondary btn-sm">Sign In</a>
            <a routerLink="/register" class="btn btn-primary btn-sm">Register</a>
          </div>
        }
      </div>
    </header>
  `,
  styles: [`
    .navbar {
      background: rgba(17, 24, 39, 0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .navbar-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0.85rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
    }

    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      color: #fff;
      font-size: 1.15rem;
      font-weight: 700;
      text-decoration: none;
    }

    .brand-icon {
      background: var(--primary);
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm);
      color: #fff;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .nav-link {
      color: var(--text-muted);
      padding: 0.45rem 0.85rem;
      border-radius: var(--radius-sm);
      font-weight: 500;
      font-size: 0.9rem;
      transition: all 0.15s ease;
      text-decoration: none;
    }

    .nav-link:hover, .nav-link.active {
      color: #fff;
      background: rgba(255, 255, 255, 0.06);
    }

    .nav-link.active {
      color: #818cf8;
      font-weight: 600;
    }

    .nav-user {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .user-name {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-main);
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
  `]
})
export class NavbarComponent {
  readonly authService = inject(AuthService);
}
