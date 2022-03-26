import { mutableHandlers, readonlyHandlers, shalldowReadonlyHandlers } from './baseHandlers';

export const enum ReactiveFlags {
  IS_REACTIVE = "_v_isReactive",
  IS_READONLY = "_v_isReadonly",
};


export function reactive(raw: any) {
  return createActionObject(raw, mutableHandlers)
}

export function readonly(raw: any) {
  // 修饰的变量无法被修改
  return createActionObject(raw, readonlyHandlers)
};

export function shalldowReadonly(raw: any) {
  return createActionObject(raw, shalldowReadonlyHandlers)
};

export function isReactive(value: any) {
  // return value[ReactiveFlags.IS_REACTIVE] 理应这样写，但是考虑到value可能不是Proxy对象，如果不是 => foo[key] 不会触发 get 操作，因此不会有返回值
  return !!value[ReactiveFlags.IS_REACTIVE]
};

export function isReadonly(value: any) {
  // 如果 直接 return value[ReactiveFlags.IS_READONLY] => 会导致 undefined
  /*
    举例：
    const observed = { foo:1, { bar: 2 } }
    isReadonly(observed)
    => value: { foo: 1, { bar: 2 } }
      return observed[ReactiveFlags.IS_READONLY]  => 
  */
  return !!value[ReactiveFlags.IS_READONLY]
};

export function isProxy(value: any) {
  return isReactive(value) || isReadonly(value)
};


function createActionObject(raw: any, baseHandlers) {
  return new Proxy(raw, baseHandlers)
}
