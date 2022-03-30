import { createVNode } from "./vnode"
import { render } from "./renderer"

export function createApp(rootComponent) {
  return {
    mount(rootContainer) {
      // 转为 vnode
      // component -> vnode
      // 所有的逻辑操作 都会基于 rootComponent 生成 vnode -> vnode 处理
      // 第一次： rootComponent -> App
      /* App.js
        rootComponent : {
          render(),
          setup()
        }
      */

      // 创建根组件
      const vnode = createVNode(rootComponent)

      // 渲染
      render(vnode, rootContainer)
    }
  }
};
