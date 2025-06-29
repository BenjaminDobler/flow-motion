import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EditorComponent, NgxEditorModel } from 'ngx-monaco-editor-v2';
import {
  formatAst,
  parsePrismaSchema,
  PrismaSchema,
  getModelAttributes
} from '@loancrate/prisma-schema-parser';
import { NgBondContainer } from '../../lib/ngbond/components/ng-bond-container/ng-bond-container';
import { NgBondProperty } from '../../lib/ngbond/components/ng-bond-property/ng-bond-property';
import { NgBondWorld } from '../../lib/ngbond/components/ng-bond-world/ng-bond-world.component';
import { config, language } from './util/prisma.lang';

declare var monaco: any;

const examplePrismaSchema = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  posts     Post[]
}

model Post {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  published Boolean  @default(false)
  title     String   @db.VarChar(255)
  author    User?    @relation(fields: [authorId], references: [id])
  authorId  Int?
}

enum Role {
  USER
  ADMIN
}
`;

@Component({
  selector: 'app-prisma',
  imports: [
    EditorComponent,
    FormsModule,
    NgBondContainer,
    NgBondWorld,
  ],
  templateUrl: './prisma.component.html',
  styleUrl: './prisma.component.scss',
})
export class PrismaComponent {
  editor: any;

  models = signal<any[]>([]);
  options = {
    theme: 'vs-dark',
  };
  code = signal<string>(examplePrismaSchema);

  model = signal<NgxEditorModel>({
    value: this.code(),
    language: 'prisma',
  });

  ast = signal<PrismaSchema | undefined>(undefined);

  onInit(editor: any) {
    this.editor = editor;
  }

  async onCodeChange(code: string) {
    console.log('Code changed:', code);

    const ast = parsePrismaSchema(code);
    console.log('AST:', ast);

    this.ast.set(ast);

    const declarations = ast.declarations;

    console.log(JSON.stringify(ast, null,2));

    const models: any[] = [];
    declarations.map((declaration) => {
      console.log(declaration.kind);
      if (declaration.kind === 'model') {
        const model: any = {
          fields: [],
        };
        console.log('Model Declaration:', declaration.name.value);
        model.name = declaration.name.value;
        declaration.members.map((member) => {
          console.log(member.kind);
          if (member.kind === 'field') {
            const field: any = {};
            field.name = member.name.value;

            if (member.type.kind === 'typeId') {
              field.type = member.type.name.value;
            } else if (member.type.kind === 'optional') {
              field.type = (member as any).type.type.name.value;
              console.log(
                'optional member ',
                (member as any).type.type.name.value,
              );
            } else if (member.type.type.kind === 'typeId') {
              field.type = member.type.type.name.value;
            } else {
              console.log('Unknown type kind:', member.type.kind);
              console.log(member);
            }
            //field.type = (member as any).type.type.name.value;
            //field.type = member.type.value;
            //field.attributes = member.attributes.map((attr: any) => attr.value);
            model.fields.push(field);
          }
        });

        models.push(model);
      } else if (declaration.kind === 'enum') {
        // console.log('Enum Declaration:', declaration.name.value);
        // declaration.members.map((member) => {
        //   console.log(member.kind);
        // });
      }
    });

    this.models.set(models);

    console.log(formatAst(ast));
  }

  onFieldNameChanged(fullModel: any, evt: any, obj: any, name: string) {
    console.log('evt ', evt);

    const previousValue = obj[name];
    obj[name] = evt.target.value;
    obj.value = evt.target.value;

    let declaration;
    for(declaration of fullModel.declarations) {
      if (declaration.kind === 'model') {
        let member;
        for(member of declaration.members) {
          console.log(member);
          // console.log('TypeKind', member.type.kind,'   ', previousValue);
          if (member.type.kind === 'list' && member.type.type.kind === 'typeId') {
            console.log(member.type.type.name.value);
            if (member.type.type.name.value === previousValue) {
              console.log('Update value ',member);
              member.type.type.name.value = evt.target.value;
            }
          } else if(member.type?.name?.value === previousValue) {
            console.log('prev val found ', member);
            member.type.name.value = evt.target.value;
          }
        }
      }
    }

    //member.type.type.name.value



    if (this.ast()) {
      const newCode = formatAst(fullModel as any);
      this.model.update((x) => ({ ...x, value: newCode }));
    }
  }
}
