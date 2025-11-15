import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EditorComponent, NgxEditorModel } from 'ngx-monaco-editor-v2';
import { formatAst, parsePrismaSchema, PrismaSchema } from '@loancrate/prisma-schema-parser';
import { KeyManager, FMContainer, FMService, FMWorld, SelectionManager } from '@richapps/flow-motion';

declare let monaco: any;
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

interface Field {
  type: string;
}

interface Model {
  name: string;
  fields: Field[];
}

@Component({
  selector: 'app-prisma',
  imports: [EditorComponent, FormsModule, FMContainer, FMWorld],
  templateUrl: './prisma.component.html',
  styleUrl: './prisma.component.scss',
  providers: [FMService, SelectionManager, KeyManager],
})
export class PrismaComponent {
  editor: any;

  models = signal<Model[]>([]);
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
    console.log('editor ', editor);
    this.editor = editor;
  }

  async onCodeChange(code: string) {
    const ast = parsePrismaSchema(code);
    this.ast.set(ast);
    const declarations = ast.declarations;

    const models: any[] = [];
    declarations.map((declaration) => {
      if (declaration.kind === 'model') {
        const model: Partial<Model> = {
          fields: [],
        };
        model.name = declaration.name.value;
        declaration.members.map((member) => {
          if (member.kind === 'field') {
            const field: any = {};
            field.name = member.name.value;

            if (member.type.kind === 'typeId') {
              field.type = member.type.name.value;
            } else if (member.type.kind === 'optional') {
              field.type = (member as any).type.type.name.value;
            } else if (member.type.type.kind === 'typeId') {
              field.type = member.type.type.name.value;
            } else {
              console.log('Unknown type kind:', member.type.kind);
              console.log(member);
            }
            //field.type = (member as any).type.type.name.value;
            //field.type = member.type.value;
            //field.attributes = member.attributes.map((attr: any) => attr.value);
            model.fields?.push(field);
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
    const previousValue = obj[name];
    obj[name] = evt.target.value;
    obj.value = evt.target.value;

    let declaration;
    for (declaration of fullModel.declarations) {
      if (declaration.kind === 'model') {
        let member;
        for (member of declaration.members) {
          if (member.type.kind === 'list' && member.type.type.kind === 'typeId') {
            if (member.type.type.name.value === previousValue) {
              member.type.type.name.value = evt.target.value;
            }
          } else if (member.type?.name?.value === previousValue) {
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
