import { inject } from "@angular/core";
import { ComponentFactory } from "./component.factory";
import { SerializationService } from "./serialization.service";
import { debounceTime, throttle } from "rxjs";



export class History {


    serialization = inject(SerializationService);

    historystack: any[] = [];
    currentIndex = -1;
    lastWasUndo = false;

    componentFactory = inject(ComponentFactory);


    constructor() {
        this.componentFactory.changes$.pipe(debounceTime(500)).subscribe(() => {
            this.add();
        });
    }


    add() {
        if(this.lastWasUndo) {
            this.lastWasUndo = false;
            return;
        }
        const serializedState = this.serialization.serialize(false);
        // If we are not at the end of the history stack, remove all future states
        if (this.currentIndex < this.historystack.length - 1) {
            this.historystack = this.historystack.slice(0, this.currentIndex + 1);
        }
        this.historystack.push(serializedState);
        this.currentIndex++;
        console.log('History added, current index:', this.currentIndex, 'stack length:', this.historystack.length);
    }

    undo() {
        this.lastWasUndo = true;
        if (this.canUndo()) {
            this.currentIndex--;
            const state = this.historystack[this.currentIndex];
            this.serialization.loadSerialized(state);
        }
    }

    redo() {
        this.lastWasUndo = true;
        if (this.canRedo()) {
            this.currentIndex++;
            const state = this.historystack[this.currentIndex];
            this.serialization.loadSerialized(state);
        }
    }

    canUndo(): boolean {
        return this.currentIndex > 0;
    }

    canRedo(): boolean {
        return this.currentIndex < this.historystack.length - 1;
    }

}