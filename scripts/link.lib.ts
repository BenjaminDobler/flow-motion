

// const node_path = path.resolve(context.cwd, `node_modules/@${context.workspace.npmScope}/${context.projectName}`);
//         await fs.rm(node_path, { recursive: true, force: true });
//         await fs.mkdir(path.resolve(node_path, '..'), { recursive: true });
//         await fs.symlink(dist_path, node_path, 'dir');

console.log('Linking library to node_modules' , process.argv);

const project = process.argv.find(arg => arg.startsWith('--project='));
if (!project) {
  console.error('No project specified. Use --project=<project-name>');
  process.exit(1);
}   
const projectName = project.split('=')[1];
console.log('Project name:', projectName);

// read angular.jsonor workspace.json
const fs = require('fs');
const path = require('path');       

const workspacePath = path.resolve(__dirname, '..', 'angular.json');
const workspace = JSON.parse(fs.readFileSync(workspacePath, 'utf8'));
const projectConfig = workspace.projects[projectName];
if (!projectConfig) {
  console.error(`Project ${projectName} not found in angular.json`);
  process.exit(1);
}   
const distPath = path.resolve(__dirname, '..', 'dist', projectName);
console.log('Dist path:', distPath);

// read the lib name from package.json
const packageJsonPath = path.resolve(distPath, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const libName = packageJson.name;   

const nodeModulesPath = path.resolve(__dirname, '..', 'node_modules', libName);
console.log('Node modules path:', nodeModulesPath);
// remove the existing symlink if it exists
if (fs.existsSync(nodeModulesPath)) {
  fs.rmSync(nodeModulesPath, { recursive: true, force: true });
}   
// create a symlink to the dist folder

// if librar name is scoped and scrope folder does not exist, create it
const scope = libName.split('/')[0];
const scopePath = path.resolve(__dirname, '..', 'node_modules', scope);
if (!fs.existsSync(scopePath)) {
  fs.mkdirSync(scopePath, { recursive: true });
}
fs.symlinkSync(distPath, nodeModulesPath, 'dir');
