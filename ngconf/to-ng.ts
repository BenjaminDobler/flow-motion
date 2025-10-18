import fg from 'fast-glob';
import { join } from 'path';

async function init() {
  const entries = fg.globSync(['**/ngconf.js'], { dot: true });
  console.log(entries);

  for (const entry of entries) {
    const project = await import(join(process.cwd(), entry));
    console.log('project', project);
  }
}
init();