import { getCurrentInstance } from './component';
export function provide(key, value) {
  // key foo
  // value fooVal
  // 存
  // 首先获取当前的组件实例
  const currentInstance = getCurrentInstance()
  if (currentInstance) {
    let { provides } = currentInstance
    const parentProvides = currentInstance.parent.provides

    // init
    if (provides === parentProvides) {

      // Object.create 函数表示 创建原型链
      // 把 parentProvides 挂载到 currentInstance.provides 上
      provides = currentInstance.provides = Object.create(parentProvides)

    }
    provides[key] = value

  }
}

export function inject(key, defaultValue) {
  // 取
  const currentInstance = getCurrentInstance()

  if (currentInstance) {

    // 这里需要提供一个 parent 来指定谁的 provide
    const parentProvides = currentInstance.parent.provides

    if (key in parentProvides) {
      return parentProvides[key]
    } else if (defaultValue) {
      if (typeof defaultValue === "function") {
        return defaultValue()
      }
      return defaultValue
    }

  }
}