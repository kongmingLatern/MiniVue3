# Reactive 依赖收集思路

## Reactive API

`createReactiveObject` ： 创建 ``reactive`` 对象
> 函数首先判断 ``target`` 是否是一个``数组`` 或者 ``对象``类型，如果不是直接返回。\
> 原始数据 ``target`` 必须是``数组`` 或者 ``对象``
> 对于一个**已经是响应式**的对象，再次执行后**仍旧应该是一个响应式对象**

使用 ``TypeScript`` 实现 reactive [基本流程]

~~~ts
function reactive(raw) {
  return new Proxy({}, {
    get(target, key) {
      // 返回该对象的属性值
      const res = Reflect.get(target, key)
      // 如果获取到的对象依旧是一个对象，那么给他的内部继续包裹 reactive
      if (isObject(res)) {
        return reactive(res)
      }
      // 收集依赖，具体收集可以查看 effect.md
      track(target, key)

      return res
    },
    set(target, key, value) {
      // 更改指定 key 的值
      const res: boolean = Reflect.set(target, key, value)
      // 触发依赖
      trigger(target, key)

      return res
    },
  })
}
~~~
