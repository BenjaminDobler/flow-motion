import {
  contentChildren,
  Directive,
  effect,
  ElementRef,
  EventEmitter,
  inject,
  input,
  Input,
  model,
  Output,
  Signal,
  signal,
  viewChildren,
} from '@angular/core';
import { makeDraggable } from '../drag-directive/drag.util';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DragService, Link } from '../../services/drag.service';
import { DragWorld } from '../drag-world/drag.world';
import { preserveWhitespacesDefault } from '@angular/compiler';

@Directive({
  selector: '[dragproperty]',
  standalone: true,
  exportAs: 'dragproperty',
})
export class DragProperty {
  el: ElementRef = inject(ElementRef);

  @Input()
  positioning: 'none' | 'absolute' | 'transform' = 'absolute';

  @Input()
  resizable = true;

  @Input()
  id?: string;

  @Input()
  minWidth = 0;

  @Input()
  minHeight = 0;

  dragproperty = input<string>('');

  x = model(0);
  y = model(0);

  gX = model(0);
  gY = model(0);

  @Output()
  positionUpdated: EventEmitter<{ x: number; y: number }> = new EventEmitter<{
    x: number;
    y: number;
  }>();

  @Output()
  widthUpdated: EventEmitter<number> = new EventEmitter<number>();

  @Output()
  heightUpdated: EventEmitter<number> = new EventEmitter<number>();

  public resizeOffset = 5;

  //   draggableChildren = viewChildren<DraggerDirective>(DraggerDirective);
  //   draggableContentChildren =
  //     contentChildren<DraggerDirective>(DraggerDirective);

  dragService: DragService = inject(DragService);

  dragWorld: DragWorld = inject(DragWorld);

  constructor() {
    const itemElement = this.el.nativeElement;
    const drag = makeDraggable(itemElement);

    const dragPreview = {
      gX: signal<number>(0),
      gY: signal<number>(0),
    };

    let parentElement = itemElement.parentElement;
    let parentRect = parentElement.getBoundingClientRect();
    let itemRect = itemElement.getBoundingClientRect();

    let worldRect = parentRect;

    let currentPreview: Signal<Link> | null;

    let isFirstMove = true;

    drag.dragStart$.pipe(takeUntilDestroyed()).subscribe((evt) => {
      console.log('drag start');
      itemRect = itemElement.getBoundingClientRect();
      parentRect = parentElement.getBoundingClientRect();
      worldRect = parentRect;
        isFirstMove = true;
      if (this.dragWorld) {
        let worldEl = this.dragWorld.el.nativeElement;
        worldRect = worldEl.getBoundingClientRect();
      }
    });

    drag.dragMove$.subscribe((move) => {
      if (isFirstMove && this.id) {
        currentPreview = this.dragService.createPreviewLink(
          this.id,
          dragPreview,
          '#dedede'
        ) as any;
        isFirstMove = false;
      }
      const offsetX = move.originalEvent.x - move.startOffsetX;
      const offsetY = move.originalEvent.y - move.startOffsetY;

      const x = offsetX - parentRect.left;
      const y = offsetY - parentRect.top;

      const gX = x + parentRect.left - worldRect.left;
      const gY = y + parentRect.top - worldRect.top;

      dragPreview.gX.set(gX);
      dragPreview.gY.set(gY);
    });

    drag.dragEnd$.subscribe((e) => {
      console.log('dragEnd', e);
      //getComponent(e.originalEvent.target);
      const targetComp = this.dragService.getComponent(e.originalEvent.target);
      console.log(e.originalEvent.target);
      console.log('target comp ', targetComp);

      if (this.id && targetComp?.id) {
        this.dragService.createLink(this.id, targetComp.id);
      }

      if (currentPreview) {
        this.dragService.removePreview(currentPreview);
      }
    });
  }

  updatePosition() {
    const itemElement = this.el?.nativeElement;
    let parentElement = itemElement.parentElement;

    let worldRect = { left: 0, top: 0 };
    if (this.dragWorld) {
      const worldElement = this.dragWorld.el.nativeElement;
      worldRect = worldElement.getBoundingClientRect();
    }

    let parentRect = parentElement.getBoundingClientRect();
    let itemRect = itemElement.getBoundingClientRect();
    const x = itemRect.left - parentRect.left;
    const y = itemRect.top - parentRect.top;
    this.x.set(x);
    this.y.set(y);

    const gX = parentRect.left + x - worldRect.left;
    const gY = parentRect.top + y - worldRect.top;

    this.gX.set(gX);
    this.gY.set(gY);
  }

  ngOnInit() {
    this.dragService.registerDraggableElement(this);
    this.updatePosition();
  }

  ngOnDestroy() {
    this.dragService.removeDraggableElement(this);
  }
}
