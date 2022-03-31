import { initProps } from './componentProps';
import { PublicInstanceProxyHandlers } from './componentPublicInstance';
import { shalldowReadonly } from '../reactivity/reactive';
import { emit } from './componentEmit';
import { initSlots } from './componentSlots';
export function createComponentInstance(vnode: any) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    slots: {},
    emit: () => { }
  }
  // bind(null, object) => 可以让用户在之后的传参过程中只传入一个值即可
  component.emit = emit.bind(null, component) as any
  return component
};

export function setupComponent(instance) {
  // TODO:
  // 1.初始化 props
  initProps(instance, instance.vnode.props)

  // 2.初始化 slots
  initSlots(instance, instance.vnode.children)

  // 3.调用 setup()

  // 4.设置 render() 函数

  setupStatefulComponent(instance)
};

function setupStatefulComponent(instance: any) {

  const Component = instance.type

  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers)

  // 3.调用 setup()
  const { setup } = Component

  if (setup) {
    const setupResult = setup(shalldowReadonly(instance.props), {
      emit: instance.emit
    }) // setup() return 的值

    handleSetupResult(instance, setupResult)
  }
}

function handleSetupResult(instance: any, setupResult: any) {
  // TODO: function
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

