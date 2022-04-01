import { createRenderer } from '../runtime-core'

function createElement(type) {
  return document.createElement(type)
}

function patchProp(el, key, attrValue) {
  const isOn = (key: string) => /^on[A-Z]/.test(key)
  if (isOn(key)) {
    // 符合 on 开头的特殊 key
    // 绑定事件
    const eventKey = key.slice(2).toLowerCase()
    el.addEventListener(eventKey, attrValue)
  }

  el.setAttribute(key, attrValue)
}

function insert(el, parent) {
  parent.append(el)
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert
})

export function createApp(...args) {
  return renderer.createApp(...args)
}

export * from '../runtime-core'