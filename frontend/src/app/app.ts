import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { NavbarComponent } from './shared/components/navbar.component';
import { ToastComponent } from './shared/components/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private readonly http = inject(HttpClient);

  ngOnInit(): void {
    // Bootstrap Antiforgery / CSRF protection: seeds the XSRF-TOKEN cookie for all subsequent requests
    this.http.get(`${environment.apiUrl}/antiforgery/token`, { withCredentials: true }).subscribe({
      error: () => {
        // Silently handled in background
      }
    });
  }
}
