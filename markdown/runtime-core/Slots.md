# slots 插槽

什么是插槽？

> 答：插槽是可以在组件中自定义内容

~~~vue
<!-- App 组件中 -->
<template>
 <slot name="header"></slot>
</template>

<!-- Foo 组件中 -->
<template>
 <App>
     <template #header>
   自定义内容，该内容可以在 App 组件中看到哦~
  </template>
    </App>
</template>
~~~

在本节中，我们会实现

1. 支持 数组 和 文本 类型的插槽
2. 具名插槽
3. 可传参的插槽

App.js

~~~js
export const App = {
    name: "App",
    setup() {},
    render() {
        const app = h("div", {}, "app")
        
        // 实现1
        const foo = h(Foo, {}, "插槽内容") // 实现1
        
        // 实现2
        // const foo = h(Foo, {}, ["插槽内容1", "内容插槽2"]) 
        
        // 实现3：具名插槽
        // const foo = h(Foo, {}, {
        // header: h("div",{}, "header-container"),
        //  footer: h("div",{}, "footer-container")
        // }) 
        
        // 实现4：可传参插槽
        //const foo = h(Foo, {}, {
        //  header: ( { age } ) => h("div", {}. "header-container" + age),
        //  footer: () => h("div", {}, "footer")
        // })
        return h("div",{}, [app,foo])
    }
}
~~~

Foo.js

~~~js
export const Foo = {
    name: "Foo",
    setup() {},
    render() {
        const foo = h("p", {}, "foo")
        const age = 18
        
         // 实现1：文本类型
        return h("div", {}, [foo, this.$slots])
        
         // 实现2：数组类型
        return h("div", {}, [foo, renderSlots(this.$slots)])
        
        // 实现3：渲染具名插槽
        return h("div",{}, {
            renderSlots(this.$slots, "header"),
            "foo",
            renderSlots(this.$slots, "footer")
        })
    
     // 实现4：可传参的插槽
     return h("div",{}, {
            renderSlots(this.$slots, "header" + age),
            "foo",
            renderSlots(this.$slots, "footer")
        })
    }
}
~~~

## 实现

### 实现1 文本类型

在 componentPublicInstance.ts 中，我们可以定义

~~~ts
const publicProertiesMap = {
    $el: i => i.vnode.el
    $slots: i => i.slots // 需要在 component.ts 中声明一个 slots: {}
}
~~~

在 component.ts 中

~~~ts
export function setupComponent(instance) {
    // 初始化 props
  initProps()
    // 初始化 slots
    initSlots(instance,instance.vnode.chidren)
    ...
}
~~~

新建一个名为 componentSlots.ts

~~~ts
export function initSlots(instance, children) {
    instance.slots = children
}
~~~

这样我们第一个就实现完成了

renderSlots.ts

~~~ts
export function renderSlots(slots) {
    return createVNode("div", {}, slots)
}
~~~

### 实现2 数组类型

在实现之前可以思考一下为什么两个标签就不能渲染出结果呢？

> 答：因为在 initSlots 的 children 形参中，children 是一个数组，相当于 ``[ foo, [ h(), h() ] ]``，这样显然无法渲染出结果，所以我们需要对 children 进行判断，让他能够兼容两种形式

componentSlots.ts

~~~ts
export function initSlots(instance, children) {
    // 如果 children 是一个数组，那么我们可以给他的外层在包裹一层 div
    instance.slots = Array.isArray(chidren) ?
        h("div", {}, children) : children
}
~~~

### 实现3：具名插槽

实现具名插槽需要对 children 进行操作：

1. 把 children 变成 Object
2. 通过 key -> value 来实现具名

renderSlots.ts

~~~ts
export function renderSlots(slots, name) {
    const slot = slots[name]
    
    if(slot) {
        return createVNode("div", {}, slots)
    }
}
~~~

componentSlots.ts

~~~ts
export function initSlots(instance, children) {
 normalizeObjectSlots(children, instance.slots)
}

function normalizeObjectSlots(children, slots) {
    for(const key in children) {
        const val = children[key]
        // 这里我们不能直接赋值 val，因为 children[key] 有可能是 数组
        slots[key] = normalizeSlotValue(val)
    }
}

function normalizeSlotValue(value) {
    return Array.isArray(value) ? value: [value]
}
~~~

### 实现4：可传参数的插槽

renderSlots.ts

~~~ts
export function renderSlots(slots, name, props) {
    const slot = slots[name]
    
    if(slot) {
        if(typeof slot === "function") {
            return createVNode("div", {}, slots(props))
        }
    }
}
~~~

componentSlots.ts

~~~ts
function normalizeObjectSlots(children, slots) {
    for(const key in children) {
        const val = children[key]
        // 这里我们不能直接赋值 val，因为 children[key] 有可能是 数组
        slots[key] = (props) => normalizeSlotValue(val(props))
    }
    instance.slots = slots
}

~~~
