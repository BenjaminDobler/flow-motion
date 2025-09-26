import { MotionPathHelper } from 'gsap/MotionPathHelper';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import EasePack from 'gsap/EasePack';
import { gsap } from 'gsap';

gsap.registerPlugin(MotionPathHelper, MotionPathPlugin, EasePack);

const props = ['x', 'y', 'width', 'height', 'borderRadius', 'backgroundColor', 'bgColor', 'pathPosition', 'opacity', 'fontSize', 'color', 'strokeDasharray', 'pathprogress'];

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
};
