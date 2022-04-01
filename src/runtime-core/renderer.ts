import { createComponentInstance, setupComponent } from "./component"
import { ShapeFlags } from "../shared/ShapeFlags";
import { Fragment, Text } from './vnode'

export function render(vnode, container) {
  // patch
  patch(vnode, container, null)
};

// patch 函数
function patch(vnode, container, parentComponent) {
  // 处理组件
  const { shapeFlag, type } = vnode
  switch (type) {
    // Fragment
    case Fragment:
      processFlagment(vnode, container, parentComponent)
      break;
    // Text 文本
    case Text:
      processText(vnode, container)
      break

    default:
      if (shapeFlag & ShapeFlags.ELEMENT) {
        processElement(vnode, container, parentComponent)
        // STATEFUL_COMPONENT
      } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        processComponent(vnode, container, parentComponent)
      }
      break;
  }
}

// 处理 Text 类型
function processText(vnode: any, container: any) {
  const { children } = vnode // string -> 文本
  const textNode = (vnode.el = document.createTextNode(children))
  container.append(textNode)
}

// 处理 Flagment 类型
function processFlagment(vnode: any, container: any, parentComponent) {
  mountChildren(vnode, container, parentComponent)
}

// 处理 Element 类型
function processElement(vnode: any, container: any, parentComponent) {
  mountElement(vnode, container, parentComponent)
}

// 创建 element 类型
function mountElement(vnode: any, container: any, parentComponent) {
  const el = (vnode.el = document.createElement(vnode.type))
  // console.log("mountElement");

  // children => string | Array [h(), h()] | "xxx"

  const { children, shapeFlag } = vnode

  // console.log(typeof children); // typeof Array -> Object

  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    // 遍历 children 的每一个节点
    children.forEach(v => {
      // 递归的 h
      patch(v, el, parentComponent)
    });
  }

  const { props } = vnode

  const isOn = (key: string) => /^on[A-Z]/.test(key)


  for (const key in props) {
    // 属性名
    const attrName = key
    // 属性值
    const attrValue = props[key]

    if (isOn(attrName)) {
      // 符合 on 开头的特殊 key
      // 绑定事件
      const eventKey = key.slice(2).toLowerCase()
      el.addEventListener(eventKey, attrValue)
    }

    el.setAttribute(attrName, attrValue)
  }

  container.append(el)
}

// 处理 Component 类型
function processComponent(vnode: any, container: any, parentComponent) {
  mountComponent(vnode, container, parentComponent)
}

// 挂载组件
function mountComponent(initialVNode: any, container: any, parentComponent) {

  // 创建 Component instance 对象
  const instance = createComponentInstance(initialVNode, parentComponent)

  // 设置 instance 的属性
  setupComponent(instance)

  // 生命周期钩子
  setupRenderEffect(instance, initialVNode, container, parentComponent)
}

function setupRenderEffect(instance: any, initialVNode: any, container: any, parentComponent) {

  const { proxy } = instance

  // 获取 vnode (子组件)
  const subTree = instance.render.call(proxy)

  // vnode 树
  // vnode -> path
  // vnode -> element -> mountElement

  patch(subTree, container, instance)

  // element -> mount
  initialVNode.el = subTree.el

}


function mountChildren(vnode: any, container: any, parentComponent) {
  vnode.children.forEach(v => {
    patch(v, container, parentComponent)
  });
}


