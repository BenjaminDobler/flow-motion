// import { asConst, FromSchema, JSONSchema } from 'json-schema-to-ts';
import { compile, compileFromFile } from 'json-schema-to-typescript';
import * as prettier from 'prettier';

import * as fg from 'fast-glob';
import pkg from 'fs-extra';
import { join } from 'path';
import { existsSync, writeFileSync } from 'fs';
const { readJsonSync } = pkg;

const entries = fg.default.globSync(['**/package.json'], { dot: true });

const builderToInterface = new Map<string, string>();

let count = 0;
let builderFileContent: string[] = [];
let typeDefContent: string[] = [];
for (const entry of entries) {
  const pkg = readJsonSync(entry);
  if (pkg.builders) {
    const folder = entry.replace('/package.json', '');
    const builderFile = `${folder}/${pkg.builders}`;
    const builderContent = readJsonSync(builderFile);

    for (const task in builderContent.builders) {
      const schemaPath = join(folder, builderContent.builders[task].schema);
      if (existsSync(schemaPath)) {
        const schema = readJsonSync(schemaPath);

        const builderName = pkg.name + ':' + task;

        let n = builderName
          .split('/')
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join('');
        n = n
          .split(':')
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join('');
        n = n
          .split('-')
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join('');
        n = n
          .split('.')
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join('');
        n = n
          .split('@')
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join('');

        builderToInterface.set(builderName, n);

        const typeName = task.charAt(0).toUpperCase() + task.slice(1) + 'Schema';
        schema.title = builderName;
        const types = await compile(schema, n);
        builderFileContent.push(`// Types for builder: ${pkg.name}:${task}`);
        builderFileContent.push(types);

        const typeDef = `
            {
                builder: '${builderName}',
                options?: Partial<${n}>,
                configurations?: { [k: string]: Partial<${n}> },
                defaultConfiguration?: string
            }
        `;
        typeDefContent.push(typeDef);
      }
    }
  }
}

const types = `
    type Task = ${typeDefContent.join(' | ')};
`;

const projectDef = `
export type Project = {
  name: string;
  root: string;
  sourceRoot: string;
  projectType: 'application' | 'library';
  prefix?: string;
  schematics?: {
    [k: string]: {
      [k: string]: unknown;
    };
  };
  architect: {
    [k: string]: Task;
  }
};

`;

const content = builderFileContent.join('\n\n') + '\n\n' + types + '\n\n' + projectDef;
const formattedContent = await prettier.format(content, { semi: false, parser: 'typescript' });

writeFileSync('./ngconf/builders-schemas.ts', formattedContent, { encoding: 'utf-8' });
