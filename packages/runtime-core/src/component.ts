import { initProps } from './componentProps'
import { PublicInstanceProxyHandlers } from './componentPublicInstance'
import {
  shalldowReadonly,
  proxyRefs,
} from '@mini-vue3/reactivity'
import { emit } from './componentEmit'
import { initSlots } from './componentSlots'

let currentInstance: any = null // 当前组件实例

export function createComponentInstance(
  vnode: any,
  parent
) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    slots: {},
    parent,
    provides: parent ? parent.provides : {}, // 一层层赋值,
    isMounted: false,
    subTree: {},
    emit: () => {},
  }
  // bind(null, object) => 可以让用户在之后的传参过程中只传入一个值即可
  component.emit = emit.bind(null, component) as any
  return component
}

export function setupComponent(instance: {
  vnode: any
  type?: any
  setupState?: {}
  slots?: {}
  emit?: () => void
}) {
  // TODO:
  // 1.初始化 props
  initProps(instance, instance.vnode.props)

  // 2.初始化 slots
  initSlots(instance, instance.vnode.children)

  // 3.调用 setup()

  // 4.设置 render() 函数

  setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: any) {
  const Component = instance.type

  instance.proxy = new Proxy(
    { _: instance },
    PublicInstanceProxyHandlers
  )

  // 3.调用 setup()
  const { setup } = Component

  if (setup) {
    // 设置当前对象为 instance
    setCurrentInstance(instance)
    const setupResult = setup(
      shalldowReadonly(instance.props),
      {
        emit: instance.emit,
      }
    ) // setup() return 的值
    setCurrentInstance(null)
    handleSetupResult(instance, setupResult)
  }
}

function handleSetupResult(
  instance: any,
  setupResult: any
) {
  // TODO: function
  if (typeof setupResult === 'object') {
    instance.setupState = proxyRefs(setupResult)
  }
  finishComponentSetup(instance)
}

function finishComponentSetup(instance: any) {
  const Component = instance.type
  if (compiler && !Component.render) {
    if (Component.template) {
      Component.render = compiler(Component.template)
    }
  }
  // 4.设置 render() 函数
  instance.render = Component.render
}

export function getCurrentInstance() {
  return currentInstance
}

function setCurrentInstance(instance: any) {
  currentInstance = instance
}

let compiler

export function registerRuntimeCompiler(_compiler) {
  compiler = _compiler
}
