import { readonly, isReadonly, isProxy } from '../reactive';
describe('readonly', () => {
  it('happy path', () => {
    const original = { foo: 1, bar: { baz: 2 } }
    const wrapped = readonly(original)
    expect(wrapped).not.toBe(original)
    expect(isReadonly(wrapped)).toBe(true)
    expect(isReadonly(original)).toBe(false)
    expect(isReadonly(wrapped.bar)).toBe(true)
    expect(isReadonly(original.bar)).toBe(false)
    expect(isProxy(original)).toBe(false)
    expect(isProxy(wrapped)).toBe(true)
  });

  it('warn then call set', () => {
    // console.warn()
    // mock

    console.warn = jest.fn()

    const user = readonly({
      age: 10
    })
    user.age = 11

    // 是否调用了这个函数
    expect(console.warn).toBeCalled()
  });
});