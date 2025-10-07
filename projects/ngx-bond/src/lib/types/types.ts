export abstract class NgBondContainerHost {}

export interface InspectableProperty {
  name: string;
  category?: string;
  alias?: string;
  suffix?: string;
  prefix?: string;
  prefixIcon?: string;
  suffixIcon?: string;
  type: string;
  event?: string;
  options?: any[];
  min?: number;
  max?: number;
  isGetter?: boolean;
  noneSerializable?: boolean;
  readonly?: boolean;
  group?: { name: string };
}
