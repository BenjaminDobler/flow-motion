import { Component, signal, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { gsap } from 'gsap';

// const blurProperty = gsap.utils.checkPrefix('filter'),
//   blurExp = /blur\((.+)?px\)/,
//   getBlurMatch = (target) => (gsap.getProperty(target, blurProperty) || '').match(blurExp) || [];


const props = ['x', 'y', 'width', 'height'];

props.forEach((prop) => {
  gsap.registerPlugin({
    name: `signal_${prop}`,
    get(target: any) {
      return target[prop]();
    },
    init(target: any, endValue: any, b: any) {
      const currentValue = target[prop]() | 0;
      const data: any = this;
      data.target = target;
      data.interp = gsap.utils.interpolate(currentValue, endValue);
    },
    render(progress: any, data: any) {
      data.target[prop].set(data.interp(progress));
    },
  });
});

// gsap.registerPlugin({
//   name: 'signal_x',
//   get(target: any) {
//     return target.x();
//   },
//   init(target: any, endValue: any, b: any) {
//     const currentValue = target.x() | 0;
//     const data: any = this;
//     data.target = target;
//     data.interp = gsap.utils.interpolate(currentValue, endValue);
//   },
//   render(progress: any, data: any) {
//     data.target.x.set(data.interp(progress));
//   },
// });

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'gsap-demo';

  box = viewChild<any>('box');

  x = signal(200);
  y = signal(20);
  width = signal(20);
  height = signal(20);

  ngAfterViewInit() {
    // const boxRef = this.box();
    // if (boxRef) {
    //   gsap.to(boxRef.nativeElement, {
    //     x: 100,
    //     duration: 2,
    //     ease: 'power1.inOut',
    //     repeat: -1,
    //     yoyo: true,
    //   });
    // } else {
    //   console.log('Box reference is not available after view init.');
    // }

    gsap.to(this, {
      signal_x: 100,
      signal_y: 100,
      duration: 2,
      ease: 'power1.inOut',
      repeat: 0,
      yoyo: false,
    });
  }
}
