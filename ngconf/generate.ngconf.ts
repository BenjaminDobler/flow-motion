import pkg from 'fs-extra';
const { readJsonSync, existsSync, writeFileSync } = pkg;
import * as prettier from 'prettier';

const ng = readJsonSync('./angular.json');
console.log(ng);

for (const projectName in ng.projects) {
  const project = ng.projects[projectName];
  project.name = projectName;
  console.log('Project:', projectName);

  if (existsSync(project.root)) {
    console.log('exists ', project.root);

    const ngconf = `import { Project } from '@richapps/ngconf';


    export const project: Project = ${JSON.stringify(project, null, 4)};
        
        `;

    const formatted = await prettier.format(ngconf, { semi: false, parser: 'typescript' });
    writeFileSync(project.root + '/ngconf.ts', formatted, { encoding: 'utf-8' });
  } else {
    console.log('does not exist ', project.root);
  }
}
