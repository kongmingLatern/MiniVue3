# 更新 Element Props

在我们更新 element Props 的时候，需要处理的几个问题：

> 1. 之前的值和现在的值不一样 => **修改**
> 2. null | undefined => **删除**
> 3. 某个属性在新的里面没有了 => **删除**

Demo 代码：

~~~~js
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
~~~~

我们来看上次说的这个 Demo，在前面我们已经对更新逻辑进行了封装，因此我们只需要通过 ``patchElement`` 函数就可以更新 Element

我们这次来对比 Element 的 Props

## 如果对比两个节点的 Props？

> 通过遍历 各自的 props 进行对比

## 实现代码

~~~ts
function patchElement(n1, n2, container, parentComponent) {
    
    const oldProps = n1.props || EMPTY_OBJ
    const newProps = n2.props || EMPTY_OBJ  

    const el = (n2.el = n1.el)
    
    // 处理 props
    patchProps(el, oldProps, newProps);
    
}

function patchProps(el, oldProps, newProps) {
    // 1. 之前的值和现在的值不一样 => 修改
    for(const key in newProps) {
        if(oldProps[key] !== newProps[key]) {
            hostPatchProp(el, key, oldProps[key], newProps[key])
        }
    }
    // 2. null | undefined => 删除  => 可以在赋值 props 的时候操作
 【标记】
    // 3. 某个属性在新的里面没有了 => 删除
    for(const key in oldProps) {
        if(!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null)
        }
    }
}
~~~

【标记】处：

~~~js
function patchProp(el, key, prevVal, nextVal) {
  const isOn = (key: string) => /^on[A-Z]/.test(key)
  if (isOn(key)) {
    const eventKey = key.slice(2).toLowerCase()
    el.addEventListener(eventKey, nextVal)
  } else {
   / 2. null | undefined => 删除 key
    if (nextVal === undefined || nextVal === null) {
      el.removeAttribute(key)
    } else {
      el.setAttribute(key, nextVal)
    }
  }
}
~~~
