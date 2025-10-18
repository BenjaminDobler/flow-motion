// import { asConst, FromSchema, JSONSchema } from 'json-schema-to-ts';
import { compile, compileFromFile} from 'json-schema-to-typescript'

import * as fg from 'fast-glob';
import pkg from 'fs-extra';
import { join } from 'path';
import { existsSync, writeFileSync } from 'fs';
const { readJsonSync } = pkg;
// import projectSchema from '@angular/cli/lib/config/workspace-schema.json' assert { type: 'json' };
// import * as projectSchema from '@angular/cli/lib/config/workspace-schema.json';
// import * as projectSchema from '@angular/build/src/builders/application/schema.json';



const entries = fg.default.globSync(['**/package.json'], { dot: true });


const builderToInterface = new Map<string, string>();


let count = 0;
let builderFileContent: string[] = [];
let typeDefContent: string[] = [];
for(const entry of entries) {
  
  const pkg = readJsonSync(entry);
  if (pkg.builders) {
    console.log('has builder prop ', entry);
    const folder = entry.replace('/package.json', '');
    const builderFile = `${folder}/${pkg.builders}`;
    const builderContent = readJsonSync(builderFile);
    console.log('builder content', builderContent);


    for(const task in builderContent.builders) {
        const schemaPath = join(folder, builderContent.builders[task].schema);
        if (existsSync(schemaPath)) {
        const schema = readJsonSync(schemaPath);

        const builderName = pkg.name + ':' + task;



        let n = builderName.split('/').map(p=>p.charAt(0).toUpperCase() + p.slice(1)).join('');
        n = n.split(':').map(p=>p.charAt(0).toUpperCase() + p.slice(1)).join('');
        n = n.split('-').map(p=>p.charAt(0).toUpperCase() + p.slice(1)).join('');
        n = n.split('.').map(p=>p.charAt(0).toUpperCase() + p.slice(1)).join('');
        n = n.split('@').map(p=>p.charAt(0).toUpperCase() + p.slice(1)).join('');
        console.log(n);

        // let names = builderName.replace(/[!\"#$%&'\(\)\*\+,\.\/:;<=>\?\@\[\\\]\^`\{\|\}~]/g, '');
        // names = names.split('-').join('');
        // console.log('Generated name:', names);


        builderToInterface.set(builderName, n);
        
        const typeName = task.charAt(0).toUpperCase() + task.slice(1) + 'Schema';
        schema.title = builderName;
        const types = await compile(schema, n);
        builderFileContent.push(`// Types for builder: ${pkg.name}:${task}`);
        builderFileContent.push(types);

        const typeDef = `
            {
                builder: '${builderName}';
                options: ${n};
            }

        `;
        typeDefContent.push(typeDef);


        //console.log(types);
        }

    } 
  }
}

const types = `
    type Task = ${typeDefContent.join(' | ')};
`;

writeFileSync('builders-schemas.ts', builderFileContent.join('\n\n') + '\n\n' + typeDefContent.join('\n\n') + '\n\n' + types    , { encoding: 'utf-8' });

// const types = await compile(projectSchema as JSONSchema, 'ProjectSchema');
//

// const types = await compileFromFile('./node_modules/@angular/build/src/builders/application/schema.json');
// console.log(types);

// const dogSchema = {
//   type: "object",
//   properties: {
//     name: { type: "string" },
//     age: { type: "integer" },
//     hobbies: { type: "array", items: { type: "string" } },
//     favoriteFood: { enum: ["pizza", "taco", "fries"] },
//   },
//   required: ["name", "age"],
// };

// const st = asConst({
//   type: 'object',
//   properties: {
//     assets: {
//       type: 'array',
//       description: 'List of static application assets.',
//       default: [],
//       items: {
//         $ref: '#/definitions/assetPattern',
//       },
//     },
//   },
// });


// const projectSchemaAsJsonSchema = asConst(projectSchema) satisfies JSONSchema;




// const ps = asConst(dogSchema);
// type Dog = FromSchema<typeof projectSchemaAsJsonSchema>;

// const exampleDog: Dog = {
    
  
// };
