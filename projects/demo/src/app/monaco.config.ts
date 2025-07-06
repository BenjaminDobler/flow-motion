import { NgxMonacoEditorConfig } from 'ngx-monaco-editor-v2';
import { config, language } from './routes/prisma/util/prisma.lang';

declare let monaco: any;

export function onMonacoLoad() {
  console.log((window as any).monaco);

  console.log('Monaco loaded');

  monaco.languages.register({ id: 'prisma' });
  monaco.languages.setLanguageConfiguration('prisma', config);
  monaco.languages.setMonarchTokensProvider('prisma', language);

  console.log('Prisma language registered');

  // const uri = monaco.Uri.parse('a://b/foo.json');
  //   monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
  //     validate: true,
  //     schemas: [
  //       {
  //         uri: 'http://myserver/foo-schema.json',
  //         fileMatch: [uri.toString()],
  //         schema: {
  //           type: 'object',
  //           properties: {
  //             p1: {
  //               enum: ['v1', 'v2'],
  //             },
  //             p2: {
  //               $ref: 'http://myserver/bar-schema.json',
  //             },
  //           },
  //         },
  //       },
  //       {
  //         uri: 'http://myserver/bar-schema.json',
  //         fileMatch: [uri.toString()],
  //         schema: {
  //           type: 'object',
  //           properties: {
  //             q1: {
  //               enum: ['x1', 'x2'],
  //             },
  //           },
  //         },
  //       },
  //     ],
  //   });
}

export const monacoConfig: NgxMonacoEditorConfig = {
  // You can pass cdn url here instead
  baseUrl: 'assets',
  defaultOptions: { scrollBeyondLastLine: false },
  onMonacoLoad,
};
