# Reactive 依赖收集思路

## Reactive API

`createReactiveObject` ： 创建 ``reactive`` 对象
> 函数首先判断 ``target`` 是否是一个``数组`` 或者 ``对象``类型，如果不是直接返回。\
> 原始数据 ``target`` 必须是``数组`` 或者 ``对象``
> 对于一个**已经是响应式**的对象，再次执行后**仍旧应该是一个响应式对象**
