export const enum ShapeFlags {
  ELEMENT = 1, // 0001，元素
  STATEFUL_COMPONENT = 1 << 1, // 0010，组件
  TEXT_CHILDREN = 1 << 2, // 0100，文本类型的 children
  ARRAY_CHILDREN = 1 << 3 // 1000，数组类型的 children
}

/*
含义：
  0001: 元素
  0010: 组件
  0100: 文本类型的 children
  1000: 数组类型的 children
*/