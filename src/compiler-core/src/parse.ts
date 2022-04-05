import { NodeTypes } from "./ast"

const enum TagType {
  Start,
  End
}

export function baseParse(content: string) {
  const context = createParserContext(content)
  return createRoot(parseChildren(context, []))
}

function parseChildren(context, ancestors) {
  const nodes: any = []

  while (!isEnd(context, ancestors)) {
    let node
    const s = context.source
    if (s.startsWith("{{")) {
      // 模板 类型
      node = parseInterpolation(context)
    } else if (s[0] === "<") {
      // element 类型
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestors)
      }
    }
    if (!node) {
      // text 类型
      node = parseText(context)
    }
    nodes.push(node)
  }

  return nodes
}

function isEnd(context: any, ancestors): boolean {
  // 2. 遇到结束标签的时候
  const s = context.source
  // if (parentTag && s.startsWith(`</${parentTag}>`)) {
  //   return true
  // }
  if (s.startsWith("</")) {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const tag = ancestors[i].tag
      if (startsWithEndTagOpen(s, tag)) {
        return true
      }

    }
  }
  // 1. context.source 有值的时候
  return !s
}

function startsWithEndTagOpen(source, tag): boolean {
  return source.startsWith("</") && source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase()
}

function parseText(context: any) {

  let endIndex = context.source.length
  const endTokens = ["<", "{{"]

  // 如果context.source 中含有 {{ ，则只截取到 {{ 之前
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i])
    if (index !== -1 && endIndex > index) {
      endIndex = index
    }
  }

  const content = parseTextData(context, endIndex)

  return {
    type: NodeTypes.TEXT,
    content
  }
}

function parseTextData(context: any, length) {
  const content = context.source.slice(0, length)
  advanceBy(context, content.length)
  return content
}

function parseElement(context: any, ancestors: any[]) {
  // 1. 解析 tag -> 正则
  const element: any = parseTag(context, TagType.Start)
  console.log("ancestors", ancestors);

  ancestors.push(element)
  element.children = parseChildren(context, ancestors)
  ancestors.pop()

  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End)
  } else {
    throw new Error(`缺少结束标签：${element.tag}`)
  }

  return element
}

function parseTag(context: any, type: TagType) {
  const match: any = /^<\/?([a-z]*)/i.exec(context.source)
  const tag = match[1]
  advanceBy(context, match[0].length)
  advanceBy(context, 1)

  if (type === TagType.End) {
    return
  }

  return {
    type: NodeTypes.ELEMENT,
    tag
  }
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
  const rawcontent = parseTextData(context, rawContentLength) // 获取模板内容 message
  const content = rawcontent.trim()

  advanceBy(context, closeDelimiter.length)

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