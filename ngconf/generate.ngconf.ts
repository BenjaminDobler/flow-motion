import pkg from 'fs-extra';
const { readJsonSync, existsSync, writeFileSync } = pkg;

const ng = readJsonSync('./angular.json');
console.log(ng);

for (const projectName in ng.projects) {
  const project = ng.projects[projectName];
  console.log('Project:', projectName);

  if (existsSync(project.root)) {
    console.log('exists ', project.root);

    const ngconf = `import { Project } from '@richapps/ngconf';


    export const project: Project = ${JSON.stringify(project, null, 4)};
        
        `;
    writeFileSync(project.root + '/ngconf.ts', ngconf, { encoding: 'utf-8' });
  } else {
    console.log('does not exist ', project.root);
  }
}
