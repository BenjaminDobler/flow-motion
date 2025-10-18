import { Project } from '@richapps/ngconf';


    export const project: Project = {
    "projectType": "library",
    "root": "projects/ngx-pentool",
    "sourceRoot": "projects/ngx-pentool/src",
    "prefix": "lib",
    "architect": {
        "build": {
            "builder": "@angular/build:ng-packagr",
            "configurations": {
                "production": {
                    "tsConfig": "projects/ngx-pentool/tsconfig.lib.prod.json"
                },
                "development": {
                    "tsConfig": "projects/ngx-pentool/tsconfig.lib.json"
                }
            },
            "defaultConfiguration": "production"
        },
        "test": {
            "builder": "@angular/build:karma",
            "options": {
                "tsConfig": "projects/ngx-pentool/tsconfig.spec.json",
                "polyfills": [
                    "zone.js",
                    "zone.js/testing"
                ]
            }
        },
        "lint": {
            "builder": "@angular-eslint/builder:lint",
            "options": {
                "lintFilePatterns": [
                    "projects/ngx-pentool/**/*.ts",
                    "projects/ngx-pentool/**/*.html"
                ],
                "eslintConfig": "projects/ngx-pentool/eslint.config.js"
            }
        }
    }
};
        
        