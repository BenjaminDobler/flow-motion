import { Component, ContentChildren, contentChildren, effect, QueryList, ViewChildren, viewChildren, ViewContainerRef } from '@angular/core';
import { ContentDirective } from '../../directives/content.directive';
import { TestComponent } from '../Test/Test.component';

@Component({
  selector: 'app-world',
  imports: [],
  templateUrl: './world.component.html',
  styleUrl: './world.component.scss',
})
export class WorldComponent {
  contentChildren = contentChildren<TestComponent>(TestComponent, { descendants: true });
  viewChildren = viewChildren<TestComponent>(TestComponent);
  contentChildren2 = contentChildren<TestComponent>('appContent', { descendants: true });

  @ContentChildren(TestComponent, { descendants: true })
  contentDirectives!: TestComponent[];

  @ViewChildren(TestComponent)
  viewChildren3!: any;

  viewChildren2 = viewChildren<TestComponent>(TestComponent);

  @ViewChildren('viewRef', { read: ViewContainerRef })
  public viewRefs?: QueryList<ViewContainerRef>;

  constructor() {}

  ngAfterViewInit() {
    if (this.viewRefs) {
      this.viewRefs.changes.subscribe((list: QueryList<ViewContainerRef>) => {
        list.forEach((viewRef: ViewContainerRef, index: number) => {
          console.log(`ViewContainerRef at index ${index}:`, viewRef);
        });
      });
    }
  }

  logDirectives() {
    console.log('Content Directives:', this.contentDirectives);

    console.log('Content Directives:', this.viewChildren3);
  }
}
