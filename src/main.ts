// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { appConfig } from './app/app.config';
import { App } from './app/app.component';

/**
 * Merge appConfig with provideHttpClient()
 * - If appConfig is an object (bootstrap options), preserve its properties and append to providers.
 * - If appConfig is an array (providers), convert to options object.
 * - Otherwise fall back to providing only provideHttpClient().
 */
const mergedConfig = (() => {
  if (appConfig && typeof appConfig === 'object' && !Array.isArray(appConfig)) {
    // appConfig looks like bootstrap options: { providers: [...], ... }
    return {
      ...appConfig,
      providers: [...(appConfig.providers ?? []), provideHttpClient()]
    };
  }

  if (Array.isArray(appConfig)) {
    // appConfig is an array of providers
    return { providers: [...appConfig, provideHttpClient()] };
  }

  // fallback: no appConfig or unexpected shape
  return { providers: [provideHttpClient()] };
})();

bootstrapApplication(App, mergedConfig).catch((err) => console.error(err));
