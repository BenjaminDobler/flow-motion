"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var p = {
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
};
exports.default = p;
