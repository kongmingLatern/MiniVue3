import { createVNode } from "./vnode"
import { render } from "./renderer"

export function createApp(rootComponent) {
  return {
    mount(rootContainer) {
      // 转为 vnode
      // component -> vnode
      // 所有的逻辑操作 都会基于 rootComponent 生成 vnode -> vnode 处理
      const vnode = createVNode(rootComponent)

      render(vnode, rootContainer)
    }
  }
};
