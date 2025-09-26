import { Component, inject, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Link,
  NgBondContainer,
  NgBondProperty,
  NgBondService,
  SelectionManager,
  ComponentFactory,
  ElementPropertyInspectorComponent,
  ElementTreeComponent,
  AlignmentInspectorComponent,
  ConnectionInspectorComponent,
  TextComponentComponent,
  LinkPropertiesComponent,
} from '@richapps/ngx-bond';
import { InspectorTweenProperties, TimelineService } from '@richapps/ngx-bond-timeline';

type tabType = 'properties' | 'children' | 'selection' | 'element-inspector' | 'child-tree' | 'tween';
type Tab = {
  label: string;
  value: tabType;
};

@Component({
  selector: 'bond-inspector',
  imports: [
    FormsModule,
    ConnectionInspectorComponent,
    ElementTreeComponent,
    AlignmentInspectorComponent,
    ElementPropertyInspectorComponent,
    ElementPropertyInspectorComponent,
    LinkPropertiesComponent,
    ElementTreeComponent,
    ConnectionInspectorComponent,
    InspectorTweenProperties,
  ],
  templateUrl: './inspector.component.html',
  styleUrl: './inspector.component.scss',
})
export class InspectorComponent {
  protected bondService: NgBondService = inject(NgBondService);
  protected selected = signal<tabType>('element-inspector');
  protected selectionManager: SelectionManager = inject(SelectionManager);
  protected componentFactory = inject(ComponentFactory);
  protected timelineService = inject(TimelineService);

  protected tabs = signal<Tab[]>([
    { label: 'Element', value: 'element-inspector' },
    { label: 'Children', value: 'child-tree' },
    { label: 'Connection', value: 'properties' },
  ]);

  animationBubbleCount = signal(5);
  animationBubbleDuration = signal(4);

  updateProperty(s: WritableSignal<any>, property: string, value: unknown) {
    s.update((x) => ({
      ...x,
      [property]: value,
    }));
  }

  updateAnimateLink(link: Link, evt: Event) {
    const target = evt.target as HTMLInputElement;
    const container = this.bondService.getBrondPropertyById(link.inputId);

    if (!container) {
      console.warn(`No container found for link inputId: ${link.inputId}`);
      return;
    }

    const property1 = container.injector.get(NgBondProperty);

    property1.animatedLink.set(target.checked);
  }

  toggleSelection(target: NgBondContainer) {
    if (this.selectionManager.isSelected(target)) {
      this.selectionManager.unselect(target);
    } else {
      this.selectionManager.select(target);
    }
  }

  addText() {
    this.componentFactory.addComponent(TextComponentComponent, { resizable: false, bgColor: 'transparent' });
  }

  serialize() {
    const components = this.componentFactory.serializeComponents();
    const timelineData = this.timelineService.timeline();
    console.log('Timeline Data:', timelineData);

    components.timeline = timelineData;

    localStorage.setItem('serialized', JSON.stringify(components, null, 2));
    console.log('Serialized:', JSON.stringify(components, null, 2));
  }

  loadSerialized() {
    const serialized = localStorage.getItem('serialized');

    if (serialized) {
      const serializedObj: any = JSON.parse(serialized);

      this.componentFactory.loadSerialized(serializedObj);

      const timelineData = serializedObj.timeline;
      timelineData.groups.forEach((g: any) => {
        g.tracks.forEach((track: any) => {
          track.tweens = track.tweens.map((tween: any) => {
            console.log(tween);
            const start = track.keyframes.find((kf: any) => kf.time === tween.start.time);
            const end = track.keyframes.find((kf: any) => kf.time === tween.end.time);

            if (start && end) {
              tween.start = start;
              tween.end = end;
            }
            return tween;
          });
        });
      });

      setTimeout(() => {
        this.timelineService.timeline.set(serializedObj.timeline);
        this.timelineService.createGsapTimeline();
      }, 500);
    }
  }
}
