import { track, trigger } from "./effect"
import { ReactiveFlags, reactive, readonly } from './reactive';
import { isObject } from "../shared";
import { extend } from '../shared/index';

const get = createGetter()
const set = createSetter()

const readonlyGet = createGetter(true)
const shalldowReadonlyGet = createGetter(true, true)

export function createGetter(isReadonly = false, isShallowReadonly = false, isRef = false) {
  return function get(target, key) {
    // 判断 key 是否是 reactive 或 readonly
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly
    }
    const res = Reflect.get(target, key)
    if (isShallowReadonly) {
      return res
    }
    // 判断 res 是否是一个对象，如果是，给它的内部继续套上 reactive 或 readonly
    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res)
    }
    if (!isReadonly) {
      track(target, key)
    }
    return res
  }
};

export function createSetter() {
  return function set(target, key, value) {
    const res = Reflect.set(target, key, value)
    trigger(target, key)
    return res
  }
};

export const mutableHandlers = {
  get,
  set
}

export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key, value) {
    console.warn(`key: ${key} set failed, because target is readonly!`, target);
    return true
  }
}

export const shalldowReadonlyHandlers = extend({}, readonlyHandlers, {
  get: shalldowReadonlyGet
})