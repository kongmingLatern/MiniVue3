import { createRenderer } from '@mini-vue3/runtime-core'

function createElement(type) {
  return document.createElement(type)
}

function patchProp(el, key, prevVal, nextVal) {
  const isOn = (key: string) => /^on[A-Z]/.test(key)
  if (isOn(key)) {
    // 符合 on 开头的特殊 key
    // 绑定事件
    const eventKey = key.slice(2).toLowerCase()
    el.addEventListener(eventKey, nextVal)
  } else {
    if (nextVal === undefined || nextVal === null) {
      el.removeAttribute(key)
    } else {
      el.setAttribute(key, nextVal)
    }
  }
}

function insert(child, parent, anchor) {
  // parent.append(child)
  parent.insertBefore(child, anchor || null)
}

function remove(child) {
  const parent = child.parentNode
  if (parent) {
    parent.removeChild(child)
  }
}

function setElementText(el, text) {
  el.textContent = text
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  remove,
  setElementText,
})

export function createApp(...args) {
  return renderer.createApp(...args)
}

export * from '@mini-vue3/runtime-core'
