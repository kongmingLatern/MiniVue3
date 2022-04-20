# provide + inject 

## 介绍

> provide 和 inject 主要用于 祖孙 之间的数据传输

## 实现

App.js 

~~~ts
import { h, provide, inject } from '../../lib/guide-mini-vue.esm.js'

const Provider = {
  name: "Provider",
  setup() {
    provide("foo", "fooVal")
    provide("bar", "barVal")
  },
  render() {
    return h("div", {}, [
      h("p", {}, "Provider"),
      h(ProviderTwo)
    ])
  }
}
const ProviderTwo = {
  name: "ProvierTwo",
  setup() {
    provide("foo", "ProviderTwo----")
    const foo = inject("foo")
    return {
      foo
    }
  },
  render() {
    return h("div", {}, [
      h("p", {}, `ProviderTwo，调用了 inject 方法后取到的值为：${this.foo}`),
      h(Consumer)
    ])
  }
}
const Consumer = {
  name: "Consumer",
  setup() {
    const foo = inject("foo")
    const bar = inject("bar")
    const baz = inject("baz", "bazDefault")
    const bay = inject("bay", () => "Function")
    return {
      foo,
      bar,
      baz,
      bay
    }

  },
  render() {
    return h("div", {},
      `Consumer: --${this.foo} --- ${this.bar},我是baz，我的值为${this.baz}
       bay -> 函数值为: ${this.bay}
    `)
  }
}

export const App = {
  name: "App",
  setup() { },
  render() {
    return h("div", {}, [
      h("p", {}, "apiInject"),
      h(Provider)
    ])
  }
}
~~~

上述代码的结构为：

> provider **父组件**
>
> ​			**提供了**   [ 
>
> ​							**provide("foo", "fooVal")  **
>
> ​							**provide("bar", "barVal")**  
>
> ​						] 
>
> 
>
>    => ProviderTwo  **子组件**
>
> ​				**提供了** [ **provide("foo", "ProviderTwo----")** ]
>
> ​				**接收了** [ **inject("foo")** ]   期望值：``fooVal``
>
> 
>
> ​			=> Consumer  **孙组件**
>
> ​					**接收了** [ 
>
> ​									**inject("foo")**   期望值：``ProviderTwo----"``
>
> ​									**inject("bar")**  期望值：``barVal``
>
> ​									**inject("baz", "bazDefault")**  期望值：``bazDefault``
>
> ​									**inject("bay", () => "Function")** 期望值：``Function``
>
> ​								] 

新建 apiInject.ts 用来实现 ``provide`` 和 ``inject``

~~~ts
export function provide(key, value) {
    // 存
    // 获取当前组件实例
    const currentInstance = getCurrentInstance()
    
    if(currentInstance) {
         let { provides } = currentInstance // 解构出 provides 这个属性需要在component.ts 中定义，初始化的时候指向父组件的 provides  => provides: parent ? parent.provides : {}
         const parentProvides = currentInstance.parent.provides
         
         // init
         if(provides === parentProvides) {
	         provides = currentInstance.provides = Object.create(parentProvides)         
         }
         provides[key] = value
    }
   
    
}

export function inject(key, defaultValue) {
    const currentInstance = getCurrentInstance()
    
    if(currentInstance) {
        const { provides } = currentInstance.parent
        if(key in provides) {
            return provides[key]
        } else if(defaultValue) {
            if(defaultValue === "function") {
                return defaultValue()
            }
            return defaultValue
        }
    }
}
~~~



## 关于 Object.create

看以下的 demo 

~~~js
const a = {  rep : 'apple' }
const b = new Object(a)
console.log(b) // {rep: "apple"}
console.log(b.__proto__) // {}
console.log(b.rep) // {rep: "apple"}

// Object.create() 方式创建
const a = { rep: 'apple' }
const b = Object.create(a)
console.log(b)  // {}
console.log(b.__proto__) // {rep: "apple"}
console.log(b.rep) // {rep: "apple"}
~~~

总结：

> 用 new Object( xx ) 方式创建出来的对象，会把值挂载到 要赋值的对象 上
>
> 用 Object.create( xx ) 创建出来的对象，会把 xx 挂载到 **要赋值对象的原型链** 上
>
> ~~~js
> const a = { rep: 'apple' }
> const b = Object.create(a) // 把a挂载到b的原型链上，这样以后，b的原型链上就会存在a
> ~~~

## 总结

> provide 和 inject 的实现原理：
>
> 当组件使用 **inject** 的时候，会
>
> 1. 先从父组件对象上的 provides 属性中进行查找
>
> + 如果存在，直接赋值
> + 如果不存在，那么**继续从父组件的原型链上查找**
>   + 如果存在，直接赋值
>   + 如果不存在且 **inject 没有默认值 **的时候，返回 ``undefined``
>     + 如果有默认值，就赋值 默认值
>
> 

