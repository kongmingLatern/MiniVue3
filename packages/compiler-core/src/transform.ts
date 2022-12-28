import { NodeTypes } from './ast'
import { TO_DISPLAY_STRING } from './runtimeHelpers'
/**
 * 增删改查节点
 * @param root 根节点
 * @param options 操作函数对象
 */
export function transform(root, options = {}) {
  const context = createTransformContext(root, options)
  // 1. 遍历 - 深度优先搜索
  // 2. 修改 text content 的值
  traverseNode(root, context)

  createRootCodegen(root)

  root.helpers = [...context.helpers.keys()]
}

/**
 * TransformContext 初始化
 * @param root 根节点
 * @param options 操作函数
 * @returns 初始化对象
 */
function createTransformContext(
  root: any,
  options: any
): any {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
    helpers: new Map(),
    helper(key) {
      context.helpers.set(key, 1)
    },
  }
  return context
}

/**
 * 遍历搜索
 * @param node 根节点
 * @param context 插件函数
 */
function traverseNode(node: any, context: any) {
  const nodeTransforms = context.nodeTransforms
  const exitFns: any = []
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transformFunction = nodeTransforms[i]
    const onExit = transformFunction(node, context)
    if (onExit) {
      exitFns.push(onExit)
    }
  }

  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING)
      break
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChildren(node, context)
    default:
      break
  }

  let i = exitFns.length
  while (i--) {
    exitFns[i]()
  }
}

/**
 * 深度遍历搜索
 * @param node 节点
 * @param context 操作函数对象
 */
function traverseChildren(node: any, context: any) {
  const children = node.children
  if (children) {
    for (let i = 0; i < children.length; i++) {
      const node = children[i]
      traverseNode(node, context)
    }
  }
}

function createRootCodegen(root: any) {
  const child = root.children[0]
  if (child.type === NodeTypes.ELEMENT) {
    root.codegenNode = child.codegenNode
  } else {
    root.codegenNode = root.children[0]
  }
}
