import { NodeTypes, createVNodeCall } from '../ast';
export function transformElement(node, context) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      // 中间处理

      // tag
      const vnodeTag = `'${node.tag}'`

      // props
      let vnodeProps

      // children
      let vnodeChildren = null;
      if (node.children.length > 0) {
        if (node.children.length === 1) {
          // 只有一个孩子节点 ，那么当生成 render 函数的时候就不用 [] 包裹
          const child = node.children[0];
          vnodeChildren = child;
        }
      }

      node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren)
    }
  }
}