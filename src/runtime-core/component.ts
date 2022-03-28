export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type
  }
  return component
};

export function setupComponent(instance) {
  // TODO:
  // 1.初始化 props
  // initProps()

  // 2.初始化 slots
  // initSlots()

  // 3.调用 setup()

  // 4.设置 render() 函数

  setupStatefulComponent(instance)
};

function setupStatefulComponent(instance: any) {

  const Component = instance.type
  // 3.调用 setup()
  const { setup } = Component

  if (setup) {
    const setupResult = setup()
    handleSetupResult(instance, setupResult)
  }
}

function handleSetupResult(instance: any, setupResult: any) {
  // TODO function
  if (typeof setupResult === "object") {
    instance.setupState = setupResult
  }
  finishComponentSetup(instance)
}

function finishComponentSetup(instance: any) {
  const Component = instance.type
  // 4.设置 render() 函数
  instance.render = Component.render
}

