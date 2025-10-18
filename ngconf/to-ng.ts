import fg from 'fast-glob';
import pkg from 'fs-extra';
const { readJsonSync, existsSync, writeFileSync } = pkg;
import { join } from 'path';
import * as prettier from 'prettier';

async function init() {
  const ng = readJsonSync('./angular.json');

  const entries = fg.globSync(['**/ngconf.js'], { dot: true });
  console.log(entries);

  for (const entry of entries) {
    const project = await import(join(process.cwd(), entry));
    console.log('project', project);

    if (ng.projects[project.project.name]) {
        console.log('found project ', project.project.name);
        const p = project.project;
        delete p.name;
        ng.projects[project.project.name] = p;
    } else {
        console.log('project not found ', project.project.name);
    }

  }

  const formattedContent = await prettier.format(JSON.stringify(ng, null, 2), { semi: false, parser: 'json' });

  writeFileSync('./angular.json', formattedContent, { encoding: 'utf-8' });
}
init();
