import { NodeTypes } from "./ast"

export function baseParse(content: string) {
  const context = createParserContext(content)
  return createRoot(parseChildren(context))
}

function parseChildren(context) {
  const nodes: any = []
  let node
  if (context.source.startsWith("{{")) {
    node = parseInterpolation(context)
  }
  nodes.push(node)
  return nodes
}

function parseInterpolation(context) {

  const openDelimiter = "{{"
  const closeDelimiter = "}}"

  // {{message}} -> message
  // indexOf(参数1，参数2) // 参数2：查找的起始位置
  // const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length)
  // const content = context.source = context.source.slice(openDelimiter.length, closeIndex)
  // console.log(context.source); -> message}}
  // console.log('closeIndex', closeIndex); -> 9
  // console.log(context.source);

  // context.source = context.source.slice(closeIndex + 2)

  const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length)
  advanceBy(context, openDelimiter.length)

  const rawContentLength = closeIndex - openDelimiter.length // 9 - 2 = 7
  const rawcontent = context.source.slice(0, rawContentLength) // 获取模板内容 message
  const content = rawcontent.trim()

  advanceBy(context, rawContentLength + closeDelimiter.length)

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: content
    }
  }
}

function advanceBy(context: any, length: number) {
  context.source = context.source.slice(length)
}

function createRoot(children) {
  return {
    children
  }
}

function createParserContext(content: string): any {
  return {
    source: content
  }
}