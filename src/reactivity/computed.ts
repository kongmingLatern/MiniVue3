import { ReactiveEffect } from "./effect"

class ComputedRefImpl {
  _getter: any
  private _dirty: boolean = true
  private _value: any
  private _effect: ReactiveEffect
  constructor(getter) {
    this._getter = getter
    this._effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true
      }
    })
  }
  get value() {
    // get value -> dirty true
    // 当依赖的响应式对象的值发生改变的时候
    // effect
    if (this._dirty) {
      this._dirty = false
      // 相当于执行一次 computed 的 回调
      this._value = this._effect.run()
    }
    return this._value
  }
}


export function computed(getter) {
  return new ComputedRefImpl(getter)
};
