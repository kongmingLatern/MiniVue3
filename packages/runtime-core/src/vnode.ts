import { ShapeFlags } from '@mini-vue3/shared'

export { createVNode as createElementVNode }

export const Fragment = Symbol('Fragment')
export const Text = Symbol('Text')

export function createVNode(type, props?, children?) {
  const vnode: any = {
    type,
    props,
    children,
    component: null,
    next: null,
    key: props && props.key,
    shapeFlag: getShapeFlag(type),
    el: null,
  }

  if (typeof children === 'string') {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN
  }

  // 组件 + children object
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    if (typeof children === 'object') {
      vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN
    }
  }

  return vnode
}

export function createTextVNode(
  text: string,
  props: any = {}
) {
  return createVNode(Text, props, text)
}

function getShapeFlag(type: any) {
  return typeof type === 'string'
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPONENT
}
