# 组件代理 Proxy

## 疑问

在实现 **初始化 element 主流程** 的时候留下一个疑问：

如何通过 this.xx 去访问当前组件 setup 函数 return 的对应值？

> 答：通过 proxy 代理去实现
>
> 注意：这里绑定 this 不能简单地作为当前组件对象，因为后期用户可以通过 this.$el，this.$data 等 api 去调用其他内容，因此才需要用 proxy 去代理

## 实现

component.ts

~~~ts
function setupStatefulComponent(instance: any) {
    const Component = instance.type
    
    instance.proxy = new Proxy({}, 
     get(target, key) {
           // target -> ctx
           // key -> msg
         const { setupState } = component
   if(key in setupState) {
                return setupState[key]
            }
   // 对于特殊的 key 需要特殊处理
   if(key === "$el") {
                return instance.vnode.el
            }
        }
    )
}

function handleSetupResult(instance, setupResult: any) {
    if(typeof setupResult === "object") {
        instance.setupState = setupResult
    }
    finishComponentSetup(instance)
}
~~~

renderer.ts

~~~ts
function mountElement(vnode, container) {
    const el = (vnode.el = document.createElement(vnode.type))
}
function setupRenderEffect(instance: any, initialVNode, container) {
    const { proxy } = instance
    
    // 通过 call 来绑定 proxy 至 this
    const subTree = instance.render.call(proxy)
    
    patch(subTree, container)
    
    // 在所有节点都被渲染完之后，把 vnode 的 el 变为 subTree.el
    vnode.el = subTree.el
}
~~~

以上便实现了 proxy 代理 this 的过程，我们可以对上述代码进行重构：

componentPublicinstance.ts

~~~ts
const publicPropertiesMap = {
    $el: i => i.vnode.el
}
export const PublicInstanceProxyHandle = {
    get({_: instance}, key) {
       const { setupState } = instance
       if(key in setupState) {
           return setupState[key]
       }
       const publicGetter = publicPropertiesMap[key]
       if(publicGetter) {
           return publicGetter(instance)
       }
    }
}
~~~

component.ts

~~~ts
import { PublicInstanceProxyHandlers } from './componentPublicInstance'
function setupStatefulComponent(instance: any) {
    const Component = instance.type
    
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers)
}
~~~
