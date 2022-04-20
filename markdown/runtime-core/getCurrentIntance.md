# getCurrentInstance 和 setCurrentInstance

### 作用

​ 获取当前组件实例

### 实例代码

~~~ts
export const App = {
    name: "App",
    render() {
        return h("div",{}, "App")
    },
    setup() {
        const instance = getCurrentInstance()
        console.log("App", instance)
        return {}
    }
}
~~~

如何实现呢？

> 答：显然，当我们在调用 setup 函数的时候，getCurrentInstance 就有值了，因此，我们需要在调用 setup 函数之前 就获取到当前组件实例。而调用 setup 函数，是我们在 ``component.ts`` 中写的 ``setupStatefulComponent`` 函数，因此实现起来就非常简单了。

~~~ts
function setupStatefulComponent(instance) {
    ...
    const { setup } = instance
    
    if(setup) {
        // 获取当前示例对象
        setCurrentInstance(instance)
        // 调用 setup
        const setupResult = setup(shallowReadonly(instance.props),{
            emit: instance.emit
        })
        // 由于 setup 已经执行完毕，所以需要清空当前组件实例
        setCurrentInstance(null)
        // 处理 setup return 的结果
        handleSetupResult(instance)
    }
}

// 定义一个全局变量 currentInstance 来保存当前的实例
const currentInstance = null

function setCurrentInstance(instance) {
    currentInstance = instance
}

export function getCurrentInstance() {
    return currentInstance
}
~~~

注意

> 使用 setCurrentInstance 函数来对 currentInstance 进行操作有这点好处：
>
> + 当我们以后发现 currentInstance 不对的时候，可以通过断点的方式来锁定问题所在，如果均用 currentInstance = instance 而不用函数，会导致混乱，不能很清晰的锁定错误逻辑
