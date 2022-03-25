import { isTracking, trackEffects, triggerEffects } from './effect';
import { hasChanged, isObject } from '../shared/index';
import { reactive } from './reactive';
class RefImp {
  private _value: any;
  public dep: Set<unknown>;
  private _rawValue: any;

  constructor(value: any) {
    // value 可能是一个对象，如果是，则需要用 reactive 来包裹
    this._rawValue = value
    this._value = convert(value)
    this.dep = new Set()
  }
  get value() {
    // 收集依赖
    trackRefValue(this)
    return this._value
  }

  set value(newVal) {
    // 因为 this._value 可能是一个对象，因此可能会导致 Object 去对比某个值 => 错误
    // 所以需要用另一个变量来保存 this_value
    if (hasChanged(this._rawValue, newVal)) {
      // 如果value值改变，需要重新收集依赖
      this._value = convert(newVal)
      this._rawValue = newVal // 重新获取最新设置的值
      triggerEffects(this.dep) // 触发依赖
    }

  }
}

function convert(value) {
  return isObject(value) ? reactive(value) : value
}

function trackRefValue(ref: any) {
  if (isTracking()) {
    trackEffects(ref.dep)
  }
}

export function ref(value: any) {
  return new RefImp(value)
};
