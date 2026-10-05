import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withFetch, withXsrfConfiguration } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // 1. Error listener for browser uncaught exceptions
    provideBrowserGlobalErrorListeners(),

    // 2. Official stable Zoneless change detection in Angular 22
    provideZonelessChangeDetection(),

    // 3. Modern routing with view transitions & component input binding
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),

    // 4. Fetch-based HttpClient with automatic XSRF protection
    provideHttpClient(
      withFetch(),
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN'
      })
    )
  ]
};
