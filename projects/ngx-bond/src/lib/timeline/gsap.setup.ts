import { MotionPathHelper } from 'gsap/MotionPathHelper';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import EasePack from 'gsap/EasePack';
import { gsap } from 'gsap';


// MorphSVGPlugin.defaultRender = (rawData: any, target: any)=>{
//   console.log('default render function', rawData, target);
// };

gsap.registerPlugin(MotionPathHelper, MotionPathPlugin, EasePack, MorphSVGPlugin);

const props = ['x', 'y', 'width', 'height', 'pathdata', 'connectionOffset', 'borderRadius', 'backgroundColor', 'rotate', 'bgColor', 'pathPosition', 'opacity', 'fontSize', 'color', 'strokeDasharray', 'pathprogress'];

export const configureGsap = () => {
  props.forEach((prop) => {
    gsap.registerPlugin({
      name: `signal_${prop}`,
      get(target: any) {
        return target[prop]();
      },
      init(target: any, endValue: any, b: any) {
        const currentValue = target[prop]();
        const data: any = this;
        data.target = target;
        data.interp = gsap.utils.interpolate(currentValue, endValue);
      },
      render(progress: any, data: any) {
        const interpolated = data.interp(progress);
        data.target[prop].set(interpolated);
      },
    });
  });

  gsap.registerPlugin({
    name: `signal_position`,
    get(target: any) {
      return {
        x: target.x(),
        y: target.y(),
      };
    },
    init(target: any, endValue: any, b: any) {
      const currentValue = {
        x: target.x() | 0,
        y: target.y() | 0,
      };
      const data: any = this;
      data.target = target;
      data.interp = gsap.utils.interpolate(currentValue, endValue);
    },
    render(progress: any, data: any) {
      data.target.x.set(data.interp(progress).x);
      data.target.y.set(data.interp(progress).y);
    },
  });

  // for (let id = 0; id < 100; id++) {
  //   gsap.registerPlugin({
  //     name: `signal_point-position-${id}`,
  //     get(target: any) {
  //       const point = target
  //         .path()
  //         .points()
  //         .find((p: any) => p.id === id);
  //       return {
  //         x: point.x,
  //         y: point.y,
  //       };
  //     },
  //     init(target: any, endValue: any, b: any) {
  //       const point = target
  //         .path()
  //         .points()
  //         .find((p: any) => p.id === id);

  //       const currentValue = {
  //         x: point.x | 0,
  //         y: point.y | 0,
  //       };
  //       const data: any = this;
  //       data.target = point;
  //       data.interp = gsap.utils.interpolate(currentValue, endValue);
  //     },
  //     render(progress: any, data: any) {
  //       data.target.x = data.interp(progress).x;
  //       data.target.y = data.interp(progress).y;
  //     },
  //   });
  // }
};
