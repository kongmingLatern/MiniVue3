# Emit

## 疑问

什么是 emit?

> 答：子组件通过 ``emit`` 方法向父组件传递一个方法，例如 emit("add")，就是父组件传递一个 add 方法
>
> 父组件需要通过 on + Add 的方式来进行触发相应操作，同时，子组件也可以通过在后面传参的方式进行值传递，例如：emit("add", 1, 2)，同样也支持 emit("add-foo")  这种形式，对于这种形式，父组件中的触发方法为：onAddFoo

App.js

~~~js
export const App = {
    name: "App",
    setup() {
        return {}
    },
    render() {
        return h("div", {}, [
            h("div", {}, "App"),
            h(Foo, {
                // emit('add') -> on + event 来接收
                onAdd: () => {
                    console.log("onAdd")
                }
            })
           ])
    }
}
~~~

Foo.js

~~~js
export const Foo = {
    name: "Foo",
    setup(props, { emit }) {
        const emitAdd = () => {
            console.log("onAdd")
        }
        // 通过 emit 发出事件
        emit('add')
        return {
            emitAdd
        }
    },
    render() {
        const btn = h("button", {
            onClick: this.emitAdd
        }, "emitAdd")
        const foo = h("p",{}, "foo")
        return h("div", {}, [ btn, foo ])
    }
}
~~~

## 实现

在 component.ts 中，在我们对于 setup 函数的 props 传参那边加上 emit 参数

~~~ts
export function createComponentInstance() {
    const componnet = {
        type,
        vnode,
        setupState,
        // 加上一个方法属性
        emit: () => {}
    }
    
    component.emit = emit[标记] as any
    
    return component
} 

...
if (setup) {
    // 设置当前对象为 instance
    setCurrentInstance(instance)
    const setupResult = setup(shalldowReadonly(instance.props), {
      emit: instance.emit
    }) 
    // setup() return 的值
    setCurrentInstance(null)
    handleSetupResult(instance, setupResult)
}
~~~

在【标记】处，我们需要实现一下 emit 函数

创建 componentEmits.ts

~~~ts
export function emit(instance,evnet) {
    // 1.判断 instance.props 上是否存在 event
    const { props } = instance
    
    // onAdd
    // 第一个字母大写
    const capitalize = (str: string) => {
        return str.charAt(0).toUpperCase() + str.splice(1)
    }
    
    // 加上 on
    const toHanderKey = (str: string) => {
        return str ? "on" + capitalize(str) : ""
    }
    
    const handlerName = toHandlerKey(event)
    const handler = props[handlerName]
    handler && handler()
}
~~~

这样我们就实现了最简单版本的 emit



我们可以继续提高需求：能够传参 => emit("add", 1, 2)  => onAdd(a, b) {} // a = 1,b = 2

我们仅需要修改部分即可

1. 在emit 函数中添加元素

~~~ts
export function emit(instance, event, ...args) {
    ...
    
    handler && handler(...args) // 把参数传进去
}
~~~

 



我们还可以继续提高需求：能够传递 => emit("add-foo", 1, 2)  => onAddFoo(a, b) {} // a = 1,b = 2

~~~ts
export function emit(instance,evnet, ...args) {
    // 1.判断 instance.props 上是否存在 event
    const { props } = instance
    
    // 处理 add-foo 类型的字符串,可以通过 正则 来匹配
    const camelize = (str: string) => {
        return str.replace(/-(/w)/g, (_, c: string) => {
          return c ? c.toUpperCase() : ""
        })
    }
    
    // onAdd
    // 第一个字母大写
    const capitalize = (str: string) => {
        return str.charAt(0).toUpperCase() + str.splice(1)
    }
    
    // 加上 on
    const toHanderKey = (str: string) => {
        return str ? "on" + capitalize(str) : ""
    }
    
    
    const handlerName = toHandlerKey(camelize(event))
    const handler = props[handlerName]
    handler && handler(...args)
}
~~~

