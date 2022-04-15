# Element 主流程

vnode.ts 中

~~~ts
export function createVNode(type, props?, children?) {
   const vnode: any = {
       type,
       props,
       children,
       ...
   }
   return vnode
}
~~~

h.ts 中

~~~ts
export function h(type, props?, children) {
    return createVNode(type, props, children)
}
~~~

当我们在 App.js 中使用时，使用的是 h 函数。看如下代码：

~~~ts
import { h } from '../../lib/guide-mini-vue.esm.js'
export const App = {
  name: "App",
  render() {
    return h(
      "div", // type
      {
        id: "root",
        class: ["red", "fz-16"]
      },
     'hi, ' + this.msg
    )
  },
  setup() {
    // Composition API
 return {
        msg: "mini-vue"
    }
  }
}
~~~

在 main.js 中我们使用了 ``createApp`` 函数来进行渲染

main.js

~~~js
import { createApp } from '../../lib/guide-mini-vue.esm.js'
import { App } from './App.js'

const rootContainer = document.querySelector("#app")

createApp(App).mount(rootContainer)
~~~

createApp.ts 中

~~~ts
export function createApp(rootComponent) {
    return {
      mount(rootContainer) {
        // 创建根组件
        const vnode = createVNode(rootComponent)
        // 渲染
        render(vnode, rootContainer)
      }
    }
~~~

如上代码中，当我们传入在 createApp 中传入 App，那么此时的 vnode = createVNode(**App**)，而 App 是一个组件（ 对象 ）。

其实【**渲染组件**】的本质上 我们做的是把一个一个 ``Component``  **经过不断的拆箱**最后变为 一个个 ``Element`` 类型的过程。

**渲染时候的一些问题：**

1. 如何区分 ``vnode`` 是一个 ``element`` 类型 还是一个 ``component`` 类型 呢？

> 答：可以通过 **vnode.type** 来区分
>
> + 如果是一个组件，那么它是一个 **Object** ( 有 ``render`` 和 ``setup``，例如上述的 App 组件 )
> + 如果是一个元素，那么它是一个 **string( 标签 )** ( 例如：``div`` ，当我们去给一个组件不断拆箱的过程中，最后会留下 **标签元素**）

~~~ts
export function patch(vnode, container) {
    if(typeof vnode.type === "string") {
        // 是一个元素类型
        processElement(vnode,container)
    } else if(isObject(vnode.type)) {
        // 组件类型
        processComponent(vnode, container)
    }
}

function processElement(vnode, container) {
    mountElement(vnode, container);
}

function mountElement(vnode, container) {  
    const { type, props } = vnode
    
    // 创建 DOM 元素
    const el = document.createElement(type)
    
    // 处理 props，可能有多个
    for(const key in props) {
        el.setAttribute(key, props[key])
    }
    
    // 处理 children
    mountChildren(vnode.children, el)
    
    container.append(el)
}

function mountChildren(vnode, container) {
    const { children } = vnode
    // 判断 children 是否是一个数组
    if(Array.isArray(children)) {
        // 遍历并递归调用 patch 进行再次拆箱
        children.forEach(v => {
            patch(v, container)
        })
    } else if(typeof children === "string") {
        el.textContent = children
    }
}


function processComponent(vnode, container) {
    mountComponent(vnode, container);
}

~~~

2. 当渲染 ``vnode.children`` 时如果遇到数组需要怎么操作？

> 答：递归调用 ``patch`` ，通过 ``patch`` 去**判断**数组中的元素是一个组件还是一个元素
