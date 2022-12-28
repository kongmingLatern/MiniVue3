import { reactive } from '../src/reactive'
import { watch } from '../src/watch'

describe('watch', () => {
  it('happy path', () => {
    const obj = reactive({
      foo: 1,
    })
    let dummy
    watch(obj, () => {
      dummy = obj.foo
    })
    obj.foo++
    expect(dummy).toBe(2)
  })
})
