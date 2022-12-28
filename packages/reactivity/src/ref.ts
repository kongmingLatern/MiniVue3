import {
  isTracking,
  trackEffects,
  triggerEffects,
} from './effect'
import { hasChanged, isObject } from '@mini-vue3/shared'
import { reactive } from './reactive'

class RefImp {
  private _value: any
  public dep: Set<any>
  public __v_isRef = true
  private _rawValue: any

  constructor(value: any) {
    // _rawValue => 保存
    this._rawValue = value
    // value 可能是一个对象，如果是，则需要用 reactive 来包裹
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
      this._value = convert(newVal) // 判断 newVal 是否是一个对象，如果是一个对象，则用reactive实现包裹，否则就是单个值
      this._rawValue = newVal // 重新获取最新设置的值
      triggerEffects(this.dep) // 触发依赖
    }
  }
}

function convert(value: any) {
  return isObject(value) ? reactive(value) : value
}

function trackRefValue(ref: any) {
  if (isTracking()) {
    trackEffects(ref.dep)
  }
}

export function ref(value: any) {
  return new RefImp(value)
}

export function isRef(ref: any) {
  return !!ref.__v_isRef
}

export function unRef(ref: any) {
  // 判断是否是 ref 对象 ? ref.value : value
  return isRef(ref) ? ref.value : ref
}

export function proxyRefs(objectWithRef: any) {
  return new Proxy(objectWithRef, {
    get(target, key) {
      // 如果 target[key] 的对象是一个 ref 类型的，返回 .value 否则 返回本身
      return unRef(Reflect.get(target, key))
    },
    set(target, key, newVal) {
      // 如果 target[key] 本身就是一个 ref，并且 newVal 不是一个ref，那么 target[key].value = newVal
      // 如果 target[key] 本身就是一个 ref，并且 newVal 也是一个ref，则进行覆盖
      // 如果 target[key] 不是一个 ref，那么就是重新设置值
      if (isRef(target[key]) && !isRef(newVal)) {
        return (target[key].value = newVal)
      } else {
        return Reflect.set(target, key, newVal)
      }
    },
  })
}
