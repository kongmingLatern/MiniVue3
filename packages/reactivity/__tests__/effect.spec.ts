import { reactive } from '../src/reactive'
import { effect, stop } from '../src/effect'
describe('effect', () => {
  it('happy path', () => {
    const user = reactive({
      age: 10,
    })
    let nextAge
    effect(() => {
      nextAge = user.age + 1
    })
    expect(nextAge).toBe(11)

    user.age++
    expect(nextAge).toBe(12)
  })

  it('should return runner when call effect', () => {
    let foo = 10
    const runner = effect(() => {
      foo++
      return 'foo'
    })
    expect(foo).toBe(11)
    const r = runner()
    expect(foo).toBe(12)
    expect(r).toBe('foo')
  })

  it('scheduler', () => {
    let dummy
    let run: any
    const scheduler = vi.fn(() => {
      run = runner
    })

    const obj = reactive({
      foo: 1,
    })

    const runner = effect(
      () => {
        dummy = obj.foo
      },
      { scheduler }
    )
    expect(scheduler).not.toHaveBeenCalled()
    expect(dummy).toBe(1)

    // should do be called on first trigger
    obj.foo++
    expect(scheduler).toHaveBeenCalledTimes(1)

    // should not run yet
    expect(dummy).toBe(1)

    // manually run -> 手动调用
    run()

    // should have run
    expect(dummy).toBe(2)
  })

  it('stop', () => {
    let dummy
    const obj = reactive({
      prop: 1,
    })
    const runner = effect(() => {
      dummy = obj.prop
    })

    obj.prop = 2
    expect(dummy).toBe(2)

    stop(runner)
    obj.prop = 3
    expect(dummy).toBe(2)

    obj.prop++
    expect(dummy).toBe(2)

    // stopped effect should still be manually callable
    runner()
    expect(dummy).toBe(4)
  })

  it('onStop', () => {
    const obj = reactive({
      foo: 1,
    })
    const onStop = vi.fn()

    let dummy

    const runner = effect(
      () => {
        dummy = obj.foo
      },
      { onStop }
    )

    stop(runner)

    expect(onStop).toBeCalledTimes(1)
  })
})
