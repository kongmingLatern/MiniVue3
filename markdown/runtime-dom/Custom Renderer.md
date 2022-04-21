# Custom Renderer 自定义渲染器

## Custom Renderer 是什么？

> 开放了 自定义 render 函数的 API，即Custom Renderer API。

## Custom Renderer 有什么用？

> 我们可以通过 ``Custome Renderer`` 把重复逻辑抽出，以便在多个平台中使用各自的方法进行调用。
>
> 例如：``html`` 中 创建元素使用的是 ``document.createElement`` ，而 ``canvas`` 中使用的则是 ``new Element`` ，虽然他们的 API 不同，但是他们的整体逻辑功能是一样的，所以我们可以用一个 ``createElement`` 函数来代表创建元素，然后用户可以通过重写这个方法来做到平台适配！

## 如何实现呢？

在上面说到，我们需要对``相同逻辑，但是面对不同平台需要使用不同的API``的函数使用 **函数来占位**代表操作，用户可以自行设定API函数。所以我们只需要把这些函数抽离出去就可以了。

## 实现

在 createApp.ts 中

~~~ts
import { createVNode } from "./vnode"

// 我们可以使用闭包来对这个函数进行处理
export function createAppAPI(render) {
  return function createApp(rootComponent) {
    return {
      mount(rootContainer) {
          // 创建根组件
        const vnode = createVNode(rootComponent)
        // 渲染
        render(vnode, rootContainer)
      }
    }
  };
}
~~~

我们可以通过一个**闭包**的方式来实现

renderer.ts

~~~ts
import { createAppAPI } from '...'
export function createRenderer(options) {
    const {
        createElement: hostCreateElement, // 创建元素
        patchProp: hostPatchProp,// 处理 props
        insert: hostInsert,// 插入元素
        remove: hostRemove,// 去除元素
        setElementText: hostSetElementText // 设置元素文本
    } = options
    
    function render(vnode, container) { ... } 
    ...
    
    function mountElement(vnode: any, container: any, parentComponent, anchor) {
   
     // 插入元素 接口
    const el = (vnode.el = hostCreateElement(vnode.type))

    const { children, shapeFlag } = vnode


    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 遍历 children 的每一个节点
      mountChildren(vnode.children, el, parentComponent, anchor)
    }

    const { props } = vnode

    for (const key in props) {
      // 属性值
      const attrValue = props[key]

      // 处理 props 接口
      hostPatchProp(el, key, null, attrValue)
    }

     // 插入元素 接口
    hostInsert(el, container, anchor)
  }
    return {
        createApp: createAppAPI(render)
    }
}
...


~~~

新建一个 ``runtime-dom`` 的文件夹，在里面新建一个 ``index.ts``，在这个文件里，我们对这些 ``API`` 进行**重写**

~~~ts
function createElement(type: string) {
    return document.createElement(type)
}
function patchProp(el, key, val) {
    ...
}
// 方法内容省略
...

const renderer: any = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText
})

// 这样我们的 createApp 方法就会依赖于 renderer 的 createApp
export function createApp(...args) {
    return renderer.createApp(...args)
}
// 注意，这里我们需要导出 runtime-core，因为在 runtime-dom 的层级高于 runtime-core，因此我们在 src/index.ts 中导出 runtime-dom 即可
export * from '../runtime-core'
~~~
