import { isString } from '@mini-vue3/shared'
import { NodeTypes } from './ast'
import {
  CREATE_ELEMENT_VNODE,
  helperMapName,
  TO_DISPLAY_STRING,
} from './runtimeHelpers'

export function generate(ast) {
  // return {
  //   code: `
  //     return function render(_ctx, _cache, $props, $setup, $data, $options) {
  //       return "hi"
  //     }
  //   `
  // }
  const context = createCodegenContext()
  const { push } = context

  genFunctionPreable(ast, context)

  const functionName = 'render'
  const args = ['_ctx', '_cache']
  const signature = args.join(', ')

  push(`function ${functionName}(${signature}){`)
  push('return ')
  genNode(ast.codegenNode, context)
  push('}')

  return {
    code: context.code,
  }
}

function genFunctionPreable(ast: any, context: any) {
  const { push } = context
  const VueBinging = 'Vue'

  const aliasHelper = s =>
    `${helperMapName[s]}:_${helperMapName[s]}`

  if (ast.helpers.length > 0) {
    push(
      `const { ${ast.helpers
        .map(aliasHelper)
        .join(', ')} } = ${VueBinging}`
    )
  }
  push('\n')
  push('return ')
}

function createCodegenContext() {
  const context = {
    code: '',
    push(source) {
      context.code += source
    },
    helper(key) {
      return `_${helperMapName[key]}`
    },
  }
  return context
}

function genNode(node: any, context: any) {
  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context)
      break
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context)
      break

    case NodeTypes.ELEMENT:
      genElement(node, context)
      break

    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context)
      break

    case NodeTypes.TEXT:
      genText(node, context)
      break

    default:
      break
  }
}

function genText(
  node: any,
  context: { code: string; push(source: any): void }
) {
  const { push } = context
  push(`'${node.content}'`)
}

function genInterpolation(node: any, context: any) {
  const { push, helper } = context
  push(`${helper(TO_DISPLAY_STRING)}(`)
  genNode(node.content, context)
  push(`)`)
}

function genExpression(
  node: any,
  context: { code: string; push(source: any): void }
) {
  const { push } = context
  push(`${node.content}`)
}

function genCompoundExpression(node: any, context: any) {
  const { push } = context
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]
    if (isString(child)) {
      push(child)
    } else {
      genNode(child, context)
    }
  }
}

function genElement(node: any, context: any) {
  const { push, helper } = context
  const { tag, children, props } = node
  push(`${helper(CREATE_ELEMENT_VNODE)}(`)
  genNodeList(genNullable([tag, props, children]), context)
  push(')')
}

function genNodeList(nodes, context) {
  const { push } = context
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (isString(node)) {
      push(`${node}`)
    } else {
      genNode(node, context)
    }
    if (i < nodes.length - 1) {
      push(', ')
    }
  }
}

function genNullable(args: any) {
  let i = args.length
  while (i--) {
    if (args[i] != null) break
  }
  return args.slice(0, i + 1).map(arg => arg || 'null')
}
