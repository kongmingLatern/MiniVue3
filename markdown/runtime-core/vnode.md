# VNode

例如执行一段代码：

~~~js
  const rootContainer = document.querySelector("#app")
  createApp(App).mount(rootContainer)
~~~

1.App

~~~js
  return h("div", { id: "root" },"hi")
~~~

2.createApp.ts

~~~ts
createApp {
  mount() {
    // 第一步，创建虚拟节点
    createVNode(rootContainer) // app

    // 第二步，渲染视图
    render(vnode, rootContainer)
  }
}
~~~

3. renderer.ts

~~~ts
  patch(vnode, container)
~~~

通过判断 ``vnode.type`` 类型来判断渲染的是一个 ``元素``还是一个``组件``

~~~ts
// 组件 -> Object
vnode.type = {
  mount(),
  render()
}
//元素 -> string
vnode.type = "div"
~~~

~~~bash
if vnode.type === "string" 
  -> 元素
else if isObject(vnode.type)
  -> 组件
~~~

如果是组件，则进行处理，处理过程如下：

+ 创建 Component instance 对象

   ~~~ts
    const instance = createComponentInstance(initialVNode)
  ~~~

+ 给 instance 设置 **属性**

  ~~~ts
    setupComponent(instance)
  ~~~

+ 触发各种各样的依赖钩子函数

   ~~~ts
    setupRenderEffect(instance, initialVNode, container)
    ~~~

component.ts

~~~ts
createComponentInstance()

component[instance] {
  vnode,
  type: vnode.type,
  setupState: {},
  proxy: {}
}

setup() {
  return {
      msg: "mini-vue"
    }
}

setupComponent()  // 设置属性
  => setupStatefulComponent() 
      Component = instance.type // App{}
      // 取出 setup() 函数
      const { setup } = Component

      if(setup) {
        const setupResult = setup()
         [setupResult] = 
         {
          "msg": "mini-vue",
          "src": "http://www.baidu.com"
         }
          => handleSetupResult()
            if(typeof setupResult === "object") {
              instance.setupState = setupResult
            }
            => finishComponentSetup()
                const Component = instance.type
                [Component] = {
                  render(),
                  setup()
                }
                // 给组件设置 render() 函数
                instance.render = Component.render
      }
setupRenderEffect(instance, initialVNode, container)
proxy: instance.proxy
subTree: instance.render.call(proxy)

instance: {
  render() {
    window.self = this
    return h("div", { id: "sub" },"vue")
  },
  type: {
    render(),
    setup()
  },
  vnode: {
    el:
    type:
    props?:
    children?:
  },
  setupState {
    "msg": "mini-vue",
    "src": "http://www.baidu.com"
  }
}

 => patch(subTree, container)
~~~
