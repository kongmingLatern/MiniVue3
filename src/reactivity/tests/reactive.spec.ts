import { isReactive, reactive, isReadonly, readonly } from '../reactive';

describe('reactive', () => {
  it('happy path', () => {
    const original = { foo: 1 }
    const observed = reactive(original)
    const readonlyList = readonly(observed)
    const readonlyTest = reactive(readonly({ foo: 1 }))
    expect(observed).not.toBe(original)
    expect(original.foo).toBe(1)

    expect(isReactive(observed)).toBe(true)
    expect(isReadonly(readonlyList)).toBe(true)
    expect(isReactive(readonlyTest)).toBe(true)

  });
});