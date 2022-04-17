# 组件之间的 props 传参

在 vue3 中，我们是这样传参的

App 组件

~~~vue
<template>
	<Foo :count="count"></Foo>
</template>

<script setup lang="ts">
import Foo from './Foo'
const count = ref<number>(1)
</script>
~~~

在 Foo 组件中

~~~vue
<template>
	{{ count }}
</template>
<script lang="ts">
/*props: {
     count: number
 }
 或 */
 props:['count'],
 setup(props){
     console.log(props.count)
 }
</script>
~~~

在我们 mini-vue 中，我们要实现如下的功能：

App.js

~~~js
import Foo from './Foo.js'
export const App = {
    name: "App",
    setup() {
        
    },
    render() {
        return h("div",{}, 
                [
            h("div",{}, "hi"),
            h(Foo,{
                // props 传参
                count:1
            }]
                )
    }
}
~~~

在 Foo.js 中

~~~js
export const Foo = {
    name: "foo",
    setup(props) {
        console.log(props.count) // { count: 1}
        
        props.count ++ // 报错，只读属性无法修改
        console.log(props.count) // { count: 1}
    },
    render() {
        return h("div",{}. this.count)
    }
}
~~~

要如何实现该功能呢？

> 答：在我们实现 初始化 Component 主流程的时候，有一个 ``setupComponent`` 函数，这个函数中我们需要对 组件的 props 和 slots 等属性进行处理。

因此：component.ts中

~~~ts
function setupComponent(instance) {
    // 对 props 进行初始化
    initProps(instance, instance.vnode.props)
    ...
    setupStatefulComponent(instance)
}
    
function setupStatefulComponent(instance) {
    const Component = instance.type // Component: Object，其上面可能有 setup 和 render 函数
    
    // proxy 代理 instance
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers)
    
    // 调用 setup
    const { setup } = Component
    
    // 判断是否存在 setup 函数
    if(setup) {
        // 调用 setup 函数的时候，需要 setup 传参[props]
        // 然后由于 props 参数是只读的，且是 浅层只读，因此我们需要使用 shallowReadonly 来包裹
        const setupResult = setup(shallowReadonly(instance.props))
        
        // 处理 setupResult 的结果
        handleSetupResult(instan,ce setupResult) 
        ...
    }
}
~~~

我们创建一个名为 ``componentProps.ts`` 来对 initProps 进行处理

~~~ts
// h(Foo, { count: 1})
// instance -> Foo
// rawProps -> { count: 1 }
export function initProps(instance, rawProps) {
    instance.props = rawProps || {}
}
~~~

处理完了上述的props，还有一处需要处理，就是在 render 的时候，``this.count`` 的问题，这个问题我们需要在 proxy 代理中进行处理

PublicInstanceProxyHandlers.ts 中

~~~ts
const publicPropertiesMap = {
    $el: i => i.vnode.el
}
export const PublicInstanceProxyHandlers = {
    get({_: instance}, key) {
        // setupState 就是 setup return 的值
        const { setupState, props } = instance
        if(key in setupState) {
            return setupState[key]
        } 
        const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key)
        
        if(hasOwn(setupState, key)) {
            return setupState[key]
        } else if(hasOwn(props, key)) {
            return props[key]
        }
        
        // 处理特殊的字段，$el, $data 等
        const publicGetter = publicPropertiesMap[key]
        if(publicGetter) {
            // 执行函数
            return publicGetter(instance)
        }
    }
}
~~~

**当通过 this.count 的时候，key -> count，返回的值为 props[count] -> 1，这样 this.count 就可以实现了**



#### 复习：js 中的 ``Object.prototype.hasOwnProperty`` API

> **hasOwnProperty()** 方法会返回一个布尔值，指示对象自身属性中是否具有指定的属性（也就是，是否有指定的键）

~~~js
const object1 = {};
object1.property1 = 42;

console.log(object1.hasOwnProperty('property1'));
// expected output: true

console.log(object1.hasOwnProperty('toString'));
// expected output: false

console.log(object1.hasOwnProperty('hasOwnProperty'));
// expected output: false

~~~

#### 注意对比：Object.prototype.hasOwnProperty() 和 in

> **hasOwnProperty()** 所有继承了 [`Object`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object) 的对象都会继承到 `hasOwnProperty` 方法。这个方法可以用来检测一个对象是否含有特定的自身属性；和 [`in`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/in) [运算符](https://so.csdn.net/so/search?q=运算符&spm=1001.2101.3001.7020)不同，该方法会**忽略掉那些从原型链上继承到的属性**。

~~~js
Object.prototype.bar = {bar:'object prototype'}; 
var foo = {
    goo: undefined
};
console.log('bar' in foo);// expected output: true(in会查找原型链)
console.log(foo.hasOwnProperty('bar'));// expected output: false
console.log(foo.hasOwnProperty('goo'));// expected output: true
~~~

