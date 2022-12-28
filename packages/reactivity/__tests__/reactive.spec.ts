import {
  isReactive,
  reactive,
  isReadonly,
  readonly,
} from '../src/reactive'

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
  })

  test('nests reactive', () => {
    const original = {
      nested: {
        foo: 1,
      },
      array: [{ bar: 2 }],
    }
    const observed = reactive(original)

    expect(isReactive(observed.nested)).toBe(true)
    expect(isReactive(observed.array)).toBe(true)
    expect(isReactive(observed.array[0])).toBe(true)
  })
})
