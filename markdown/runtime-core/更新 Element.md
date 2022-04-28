# 更新 Element 流程

在我们 runtim-core 模块中，较为核心的是**更新 Element**，因为这步操作的需要的时间决定了整体 ``vue`` 框架的更新速度

Demo 运行代码：

~~~ts
import { h, ref } from '../../lib/guide-mini-vue.esm.js'

export const App = {
  name: "App",
  setup() {
    const count = ref(0)

    const onClick = () => {
      count.value++
    }

    const props = ref({
      foo: "foo",
      bar: "bar"
    })

    const onChangePropsDemo1 = () => {
      props.value.foo = "new-foo"
    }

    const onChangePropsDemo2 = () => {
      props.value.foo = undefined
    }

    const onChangePropsDemo3 = () => {
      props.value = {
        foo: "foo"
      }
    }

    return {
      count,
      onClick,
      props,
      onChangePropsDemo1,
      onChangePropsDemo2,
      onChangePropsDemo3,
    }
  },
  render() {
    return h(
      "div",
      {
        id: "root",
        ...this.props
      },
      [
        h("div", {}, "count:" + this.count),
        h(
          "button",
          {
            onClick: this.onClick
          },
          "click me"
        ),
        h(
          "button",
          {
            onClick: this.onChangePropsDemo1
          },
          "changeProps - 值改变 - 修改"
        ),
        h(
          "button",
          {
            onClick: this.onChangePropsDemo2
          },
          "changeProps - 值为undefined - 删除属性"
        ),
        h(
          "button",
          {
            onClick: this.onChangePropsDemo3
          },
          "changeProps - key 在新的地方没有了 - 删除"
        )
      ]
    )
  }
}
~~~

我们希望在点击按钮之后，count的值会跟着视图一起变化。那么我们需要怎么操作呢？

> 可以借助 ``setupRenderEffect``  函数来完成，因为在执行这个函数的过程中，我们可以获取到当前组件的实例以及他的 ``subTree``，这样，我们只需要**在组件更新的时候，把``subTree``收集起来，然后通过两个节点之间的对比，把对应的值更新即可！**

把 ``subTree`` 收集起来的操作 => ``effect 函数``，

在我们去调用 ``setupRenderEffect``  函数的时候，会去调用组件的 render 函数，而 render 函数中，我们会通过 this.xxx 去访问属性，因此，会调用 get 操作 => 触发 track，这样我们配合 ``effect`` 函数过后，会把当前依赖收集起来。

## 实现代码如下

~~~ts
function setupRenderEffect(instance: any, initialVNode: any, container: any, parentComponent, anchor) {
    // 收集依赖
    effect(() => {
      // isMounted => 初始化操作
      if (!instance.isMounted) {
        const { proxy } = instance
        const subTree = (instance.subTree = instance.render.call(proxy, proxy))
        patch(null, subTree, container, instance, anchor)
        initialVNode.el = subTree.el
        // 初始化完成
        instance.isMounted = true
      } else {
      // 更细操作
        const { proxy } = instance
        // 获取 vnode (子组件)
        const subTree = instance.render.call(proxy, proxy)
        const prevSubTree = instance.subTree
        instance.subTree = subTree
        patch(prevSubTree, subTree, container, instance,)
      }
    })
}

// patch 中给每一个方法都追加一个 n1，代表老节点，方便后续操作
function patch(n1, n2, container, parentComponent) {
    // n1: 老节点
    // n2: 新节点
    ...
}
    
function processElement(n1, n2, container, parentComponent) {
    if(!n1) {
        // n1 不存在，说明是 初始化
        mountElement(n2, container, parentComponent)
    } else {
        // 否则说明是 更新 逻辑
        patchElement(n1, n2, container, parentComponent)
    }
}
    
function patchElement(n1, n2, container, parentComponent) {
    // 更新逻辑
}
~~~

以上，我们就成功搭建了 Element 的更新逻辑，在我们后续的对比中，我们就会通过 ``patchElement`` 这个函数来操作。
