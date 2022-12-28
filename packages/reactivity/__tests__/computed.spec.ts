import { computed } from '../computed';
import { reactive } from '../reactive';
describe('computed', () => {
  it('happy path', () => {
    const user = reactive({
      age: 1
    })

    const age = computed(() => {
      return user.age
    })

    expect(age.value).toBe(1)
  });

  it('should compute lazily', () => {
    const value = reactive({
      foo: 1
    })
    const getter = jest.fn(() => {
      return value.foo
    })

    const cValue = computed(getter)

    // lazy, 第一次不会进行调用,只是调用了 constructor
    expect(getter).not.toHaveBeenCalled()
    // 在需要值的时候，才进行调用 (get value() => 拿到值)
    expect(cValue.value).toBe(1)
    expect(getter).toHaveBeenCalledTimes(1)

    // should not compute again，所以需要在 get value() 的实现中进行判断是否需要重新调用函数
    cValue.value
    expect(getter).toHaveBeenCalledTimes(1)

    // should not compute until needed
    value.foo = 2 // 触发 trigger -> 遍历所有依赖 -> Scheduler[this._dirty = true]，注意，此时 this._value 还是之前的值
    expect(getter).toHaveBeenCalledTimes(1)

    // now it should compute，当需要值的时候，this._dirty = true -> 调用回调了，赋新的值了
    expect(cValue.value).toBe(2)
    expect(getter).toHaveBeenCalledTimes(2)

    // should not compute again
    cValue.value
    expect(getter).toHaveBeenCalledTimes(2)
  });
});