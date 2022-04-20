# Fragment 和 Text 节点

#### 为什么需要使用 Fragment ？

> 在上节中，我们在对 **数组类型的插槽** 做处理的时候，使用了 div 来对这个数组进行处理，显然是不理想的，因此，我们需要通过实现一个 Fragment 来对 这个数组类型的节点进行处理
>
> 上节遗留的问题：
>
> ~~~ts
> export function renderSlots(slots, name = 'default', props) {
>     const slot = slots[name]
>     
>     if(slot) {
>         if(typeof slot === "function") {
>             return createVNode("div", {}, slots[props])
>             // 我们期望改成
>             return createVNode(Fragment, {}, slots[props])
>         }
>     }
> }
> ~~~
>
>

#### 实现 Fragment

renderer.ts

~~~ts
function patch(vnode, container) {
    const { type, shapeFlag } = vnode
    // type -> "div","p",... -> ELEMENT
    // type -> Foo,App -> STATEFUL_COMPONENT
    switch(type) {
        case Fragment: 
            processFragment(vnode, container) 
            break
        default:
            if(shapeFlag & ShapeFlags.ELEMENT) {
                processElement(vnode, container)
            } else if(shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                processComponnet(vnode, container)
            }
    }
}

function processFragment(vnode, container) {
    mountChildren(vnode, container)
}
~~~

vnode.ts

~~~ts
export const Fragment = Symbol("Fragment")
~~~

通过上面的更改，renderSlots.ts 就可以这样写了

~~~ts
export function renderSlots(slots, name = 'default', props) {
    const slot = slots[name]
    
    if(slot) {
        if(typeof slot === "function") {
            return createVNode(Fragment, {}, slots[props])
        }
    }
}
~~~

实现完了 Fragment ，我们再实现一个 Text

Text 有什么用？

> 答：在我们的组件中，render 函数 return 出来的值为一个个虚拟节点，如果用户需要直接渲染 文本，显然是不对的，因为单独的文本不是虚拟节点。
>
> ~~~ts
> export const App = {
>     render() {
>         return [
>             h("div",{}, '啦啦啦啦'),
>             "mini-vue" // mini-vue 就不是虚拟节点了！
>         ]
>     }
> }
> ~~~

因此，针对这个情况我们需要进行特殊处理：

~~~ts
export const App = {
    render() {
        return [
            h("div",{}, '啦啦啦啦'),
            //"mini-vue" // mini-vue 就不是虚拟节点了！
            createTextVNode("mini-vue")
        ]
    }
}
~~~

新建一个 createTextVNode 函数

~~~ts
export function createTextVNode(text: string) {
    return createVNode(Text, {}, text)
}
~~~

在 vnode.ts 中

~~~ts
export const Text = Symbol("Text")
~~~

renderer.ts

~~~ts
function patch(vnode, container) {
    const { type, shapeFlag } = vnode
    // type -> "div","p",... -> ELEMENT
    // type -> Foo,App -> STATEFUL_COMPONENT
    switch(type) {
       ...
        case Text:
         processText(vnode,container)
            break
        ...
}
        
function processText(vnode, container) {
    cosnt { children } = vnode
    const textVNode = (vnode.el = document.createTextNode(children))
    container.append(textVNode)
}
~~~

总结：

> Fragment 节点
>
> 作用：将 数组类型的虚拟节点 渲染出来，且不加任何 div 包裹
>
> 实现原理：通过定义一个 Fragment 来表示一个特殊标签，他的内部仅是 遍历 当前 vnode 的 children ( mountChildren )
>
> ============================================================
>
> Text 节点
>
> 作用：将 纯文本节点 渲染出来，无 任何标签
>
> 实现原理：通过定义一个 Text 来表示一个文本标签，他的内部是通过 ``document.createTextNode`` 来创建一个纯文本节点并挂载到 container 上
