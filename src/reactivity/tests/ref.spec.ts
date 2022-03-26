import { isRef, proxyRefs, ref, unRef } from "../ref";
import { effect } from '../effect';
import { reactive } from '../reactive';

describe('ref', () => {
  it('happy path', () => {
    const a = ref(1)
    expect(a.value).toBe(1)
  });

  it('should be reactive', () => {
    const a = ref(1)
    let dummy: any
    let calls = 0
    effect(() => {
      calls++
      dummy = a.value
    })
    expect(calls).toBe(1)
    expect(dummy).toBe(1)
    a.value = 2
    expect(calls).toBe(2)
    expect(dummy).toBe(2)
    // same value should not trigger
    a.value = 2
    expect(calls).toBe(2)
    expect(dummy).toBe(2)
  });

  it('should make nested properties reactive', () => {
    const a = ref({
      count: 1
    })
    let dummy
    effect(() => {
      dummy = a.value.count
    })

    expect(dummy).toBe(1)

    a.value.count++

    expect(dummy).toBe(2)

  });

  it('isRef', () => {
    const a = ref(1)
    const user = ref({
      age: 10
    })
    const b = reactive({
      age: 10
    })
    expect(isRef(a)).toBe(true)
    expect(isRef(user)).toBe(true)
    expect(isRef(b)).toBe(false)
    expect(isRef(1)).toBe(false)
  });

  it('unRef', () => {
    const a = ref(1)
    expect(unRef(a)).toBe(1)
    expect(unRef(1)).toBe(1)
  });

  it('proxyRefs', () => {
    const user = {
      age: ref(10),
      name: "小红"
    }
    const proxyUser = proxyRefs(user)
    // 触发 get -> 如果是一个 ref -> .value 否则 -> 本身
    expect(user.age.value).toBe(10)
    expect(proxyUser.age).toBe(10)
    expect(proxyUser.name).toBe("小红")

    // 触发 set -> 如果 target[key] 是一个 ref && newVal 不是 -> 修改 target[key].value = newVal
    proxyUser.age = 20
    expect(proxyUser.age).toBe(20)
    expect(user.age.value).toBe(20)

    // 触发 set -> 如果 target[key] 是一个ref && newVal 也是 -> 直接修改
    proxyUser.age = ref(30)
    expect(proxyUser.age).toBe(30)
    expect(user.age.value).toBe(30)

  });
});