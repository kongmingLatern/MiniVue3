# 计算属性 Computed
jest 测试

~~~js
    const value = reactive({
      foo: 1
    })
    const getter = jest.fn(() => {
      return value.foo
    })

    const cValue = computed(getter)

    // lazy
    expect(getter).not.toHaveBeenCalled()
  
    expect(cValue.value).toBe(1)
    expect(getter).toHaveBeenCalledTimes(1)

    // should not compute again
    cValue.value
    expect(getter).toHaveBeenCalledTimes(1)

    // should not compute until needed
    value.foo = 2
    expect(getter).toHaveBeenCalledTimes(1)

    // now it should compute
    expect(cValue.value).toBe(2)
    expect(getter).toHaveBeenCalledTimes(2)

    // should not compute again
    cValue.value
    expect(getter).toHaveBeenCalledTimes(2) 
~~~

问题一： 什么时候需要调用 computed 中的回调函数？
> 1. 第一次需要值的时候，即 .value 的时候
> 2. 当所绑定计算的数据触发 set 方法的时候，且 computed 的值被需要的时候，也是 .value 的时候