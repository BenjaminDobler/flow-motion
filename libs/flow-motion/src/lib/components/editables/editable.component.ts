import { ViewContainerRef } from "@angular/core";
import { InspectableProperty } from "../../types/types";
import { FMContainer } from "../fm-container/fm-container";



export interface EditableComponent {
    inspectableProperties: InspectableProperty[];
    insertSlot?: ViewContainerRef;
    container: FMContainer;
}
