# ref 实现

[TOC]

## 一、介绍

+ ``ref`` 和 ``reactive`` 一样,也是用来实现``响应式``数据的方法
+ 由于 ``reactive`` 必须传递一个对象,所以在实际开发中如果只是想让某个变量实现响应式的时候回非常麻烦
+ 所以Vue3提供了 ``ref`` 方法实现简单值得监听

## 二、ref 的使用

### 1. 定义响应式变量

~~~js
  const a = ref(1)
  console.log(a) // RefImp 对象
  console.log(a.value) // 1
~~~

### 2. 定义对象

~~~js
  const a = ref({
    age: 10
  })
  console.log(a.value.age) // 10
~~~

#### 2.1 ref 和 reactive 对比

~~~js
  const user = ref({
    age: 10
  })

  const userInfo = reactive({
    age: 10
  })

  console.log(user.value.age) // 10
  console.log(userInfo.age) // 10
~~~

**显而易见**，使用 ``ref`` 定义一个对象并不友好，而且在 ``ref`` 底层对于一个对象进行了转换 ``ref => reactive``\
所以在定义对象的时候，请使用 ``reactive``

## 三、ref 的底层实现

使用 ``TypeScript`` 实现 ``ref`` [基本流程]

~~~js
class RefImp{
  private _rawValue: any // 旧值
  private _value: any // 当前值
  public dep: Set<unknown>;
  constructor(value) {
    this._rawValue = value
    this._value = convert(value) 
    this.dep = new Set()
  }

  get value() {
    // 收集依赖
    trackRefValue(this)
    return this._value
  }

  set value(newVal) {
    // 判断 设置的值 与 当前值 是否相同
    if(hasChanged(this._rawValue, newVal)) {
      // 触发依赖
      this._value = convert(newVal) 
      this._rawValue = this._value
      triggerEffects(this.dep)
    }
  }
}

// 判断value是否是一个对象，如果是一个对象，那么就用 reactive 包裹
function convert(value) {
  return isObject(value): reactive(value): value
}

// 判断旧值和新值是否一样
export const hasChanged = (oldVal: any, newVal: any) => {
  return !Object.is(oldVal, newVal)
};

export function ref(value) {
  return new RefImp(value)
}

~~~
