# 响应式 设计思路

[TOC]

## 1. vue2 的响应式处理

在了解 vue3 的响应式之前，需要了解下 vue2 是如何实现响应式的：\
vue2 通过`Object.defineProperty` API来实现数据的响应式\
但是这个API具有以下的缺点：

+ **不能监听对象属性**新增和删除
+ 初始化阶段递归执行``Object.defineProperty``**性能负担大**

~~~html
<template>
  <div>
      <button @click="random">改变 msg 的值</button>
      <span>{{ msg }}</span>
  </div>
</template>

<script>
  export default {
    created() {
      // 通过生命周期会定义一个数据
      this.msg = 'I'm creating at created' 
    },
    methods: {
      random() {
        this.msg = Math.random()
      }
    }
  }
</script>
~~~

**问题**：当你执行完上述代码后，你会发现
> msg 的值并未发生改变。

**解释：**
> 在 created 中定义 this.msg **并不是响应式对象**\
> 因为在 vue2 中，只有 data 中定义的数据才具有响应式

### 1.1 使用 vue3 的 Composition API 进行改写

~~~html
<template>
  <div>
      <button @click="random">改变 msg 的值</button>
      <span>{{ msg }}</span>
  </div>
</template>

<script>
  export default {
    setup() {
      const state = reactive({
        msg: 'I'm msg'
      })
      const random = () => {
        state.msg = Math.randmon()
      }
      return {
        random,
        ...toRef(state)
      }
    }
  }
</script>
~~~

## 2. vue3 的响应式处理

通过 ``Proxy`` API 来劫持 ``target`` 对象的 ``getter`` 和 ``setter`` 来实现响应式

~~~bash
因为Proxy劫持的是整个对象，所以它可以检测到任何对 对象 的修改
弥补了 Object.defineProperty 的不足
~~~

**注意**：
> 因为 ``Proxy`` 劫持的是**当前对象的本身**，所以对于**对象内部还可能存在的对象**，在一开始去实现响应式【**触发 get**】的时候，它（子对象）**并不是响应式**的，需要通过判断当前对象属性是否仍是一个对象，如果是一个对象，则需要还通过``递归``的方式去重新给子对象设置响应式。

这里用 ``reactive`` 的响应式实现代码来演示\
具体如何实现 get 和 set 操作的可以查看我的 ``reactive.md``

~~~ts
const user = reactive({
  age: 10,
  math: {
    score: 88
  }
})
user.math.score ++
// Proxy 的 get 函数中
...
// 先获取用户所需要的值，例如 user.math.score
// target -> user
// age    -> math
// res -> user.math -> isObject -> reactive(user.math) ...
const res = Reflect.get(target, key)
// 判断 res 是否是一个对象
if (isObject(res)) { 
  // 如果是一个对象，则给它继续设置响应式
  return reactive(res)
}
...
~~~

## 3. 响应式的实现【简易】

实现响应式需要分为几个步骤：

+ 创建 effect
+ 执行 fn
+ 触发 get
+ 执行 track
+ 把 effect 收集起来作为依赖

我们先用 ``jest`` 来编写我们期望的 ``effect`` 函数

~~~jest
describe('effect', () => {
  it('happy path', () => {
    const user = reactive({
      age: 10
    })
    let nextAge
    effect(() => {
      nextAge = user.age + 1
    })
    // 当我们第一次写 effect() 的时候默认执行一次，并在 get 操作时将该依赖收集
    expect(nextAge).toBe(11) 

    user.age++
    // 当函数内部的对象触发了 set 操作后，需要再次调用 effect 的函数
    expect(nextAge).toBe(12) 
  });
})
~~~

[依赖收集]

~~~ts
// get 操作 => target => key => dep
/*
  结构
  [target]
      -> [key] 
            -> [fn()]
*/
  @params
  target: 当前对象
  key: 字段
  dep: 依赖
  ----------第一种情况----------
  effect(function effectFn1() => {
    user.age1
  })
 
  effect(function effectFn2() => {
    user.age1
  })
 /*
  [结构]
  user
    -> age1
          -> effectFn1
          -> effectFn2
 */
  ----------第二种情况----------
  effect(() => {
    user.age1
    user.age2
  })
 /*
  [结构]
  user
    -> age1
          -> effect
    -> age2
          -> effect
 */
  ----------第三种情况----------
  effect(function effectFn1() => {
    user.age1
  })
 
  effect(function effectFn2() => {
    user.age2
  })
  
/*
  user
    -> age1
          -> effectFn1
    -> age2
          -> effectFn2
 */
~~~

使用``TypeScript``来实现功能

~~~ts
function createGetter() {
  return new Proxy(target, {
    get(target, key) {
      const res = Reflect.get(target, key)
      // 收集依赖
      track(target,key)
      return res
    },
    set(target, key, value) {
      Reflect.set(target, key, value)
      // 触发依赖
      trigger(target, key)
    }
  })
}

let activeEffect // 用来保存当前的函数
let bucket = new Map() // 桶，用来存放所有依赖

function track(target: any, key: any) {
  // 先尝试获取 target
  let targetMap = bucket.get(target) 

  if (!targetMap) {
     // 如果没有取到 target，就初始化
      bucket.set(target, (targetMap = new Map()))
  }

  // 取到了以后，再尝试去获取依赖
  let depsMap = targetMap.get(key)

  if(!depsMap) {
    targetMap.set(key, (depsMap = new Set()))
  }
  // 已经获取到了依赖，将他收集起来即可
  depsMap.add(activeEffect)
}

function effect(fn: any) {
  activeEffect = fn
  fn()
}



~~~
