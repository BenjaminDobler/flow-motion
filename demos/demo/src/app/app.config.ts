import {
  ApplicationConfig,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideMonacoEditor } from 'ngx-monaco-editor-v2';
import { routes } from './app.routes';
import { monacoConfig } from './monaco.config';

export const appConfig: ApplicationConfig = {
  providers: [provideZonelessChangeDetection(), provideRouter(routes, withHashLocation()), provideMonacoEditor(monacoConfig)],
};
