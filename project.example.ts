import { Project } from './builders-schemas';

const p: Project = {
  root: '',
  sourceRoot: '',
  projectType: 'application',
  architect: {
    build: {
      builder: '@angular/build:application',
      options: {
        tsConfig: '',
        outputPath: '',
        index: '',
        assets: [],
        styles: [],
        scripts: [],
      }
    }
  }
}

export default p