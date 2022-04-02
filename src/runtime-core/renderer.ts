import { createComponentInstance, setupComponent } from "./component"
import { ShapeFlags } from "../shared/ShapeFlags";
import { Fragment, Text } from './vnode'
import { createAppAPI } from './createApp';
import { effect } from '../reactivity/effect';
import { EMPTY_OBJ } from "../shared";

export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText
  } = options

  function render(vnode, container) {
    // patch
    patch(null, vnode, container, null)
  };

  // patch 函数
  function patch(n1: any, n2: any, container, parentComponent: any) {
    // 处理组件
    const { shapeFlag, type } = n2
    switch (type) {
      // Fragment
      case Fragment:
        processFlagment(n1, n2, container, parentComponent)
        break;
      // Text 文本
      case Text:
        processText(n1, n2, container)
        break

      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent)
          // STATEFUL_COMPONENT
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent)
        }
        break;
    }
  }

  // 处理 Text 类型
  function processText(n1, n2: any, container: any) {
    const { children } = n2 // string -> 文本
    const textNode = (n2.el = document.createTextNode(children))
    container.append(textNode)
  }

  // 处理 Flagment 类型
  function processFlagment(n1, n2: any, container: any, parentComponent) {
    mountChildren(n2.children, container, parentComponent)
  }

  // 处理 Element 类型
  function processElement(n1, n2: any, container: any, parentComponent) {
    if (!n1) {
      // n1 不存在时，说明初始化
      mountElement(n2, container, parentComponent)
    } else {
      // 否则就是需要 更新
      patchElement(n1, n2, container, parentComponent)
    }
  }

  function patchElement(n1, n2, container, parentComponent) {
    console.log("调用 patchElement");
    console.log("n1", n1);
    console.log("n2", n2);

    const oldProps = n1.props || EMPTY_OBJ
    const newProps = n2.props || EMPTY_OBJ

    const el = (n2.el = n1.el)

    patchChildren(n1, n2, el, parentComponent)
    patchProps(el, oldProps, newProps)
  }

  function patchChildren(n1, n2, container, parentComponent) {
    // Array -> Text
    // 1. 清除 Array
    // 2. 赋值 Text
    const prevShapeFlag = n1.shapeFlag
    const { shapeFlag } = n2
    const c1 = n1.children
    const c2 = n2.children
    // 如果 n2 是 Text类型
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 并且 n1 是 Array 类型
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 去除 Array
        unmountChildren(n1.children)
        // 设置 text
        // hostSetElementText(container, c2)
      }
      if (c1 !== c2) {
        // Text -> Text || Array -> Text
        hostSetElementText(container, c2)
      }
    } else {
      // n2 是 Array 类型
      // Text -> Array
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 1. 清空 Text
        hostSetElementText(container, "")
        // 2. 挂载 Array 类型的 vnode
        mountChildren(c2, container, parentComponent)
      }
    }
  }

  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el; // 获取真实DOM元素
      hostRemove(el)
    }
  }

  function patchProps(el, oldProps: any, newProps: any) {
    for (const key in newProps) {
      const prevProp = oldProps[key]
      const nextProp = newProps[key]
      if (prevProp !== nextProp) {
        hostPatchProp(el, key, prevProp, nextProp)
      }
    }
    if (oldProps !== EMPTY_OBJ) {
      for (const key in oldProps) {
        if (!(key in newProps)) {
          hostPatchProp(el, key, oldProps[key], null)
        }
      }
    }
  }


  // 创建 element 类型
  function mountElement(vnode: any, container: any, parentComponent) {
    const el = (vnode.el = hostCreateElement(vnode.type))
    // console.log("mountElement");

    // children => string | Array [h(), h()] | "xxx"

    const { children, shapeFlag } = vnode

    // console.log(typeof children); // typeof Array -> Object

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 遍历 children 的每一个节点
      mountChildren(vnode.children, el, parentComponent)
    }

    const { props } = vnode

    for (const key in props) {
      // 属性值
      const attrValue = props[key]

      hostPatchProp(el, key, null, attrValue)
    }

    // container.append(el)
    hostInsert(el, container)
  }

  function mountChildren(children: any, container: any, parentComponent) {
    children.forEach(v => {
      patch(null, v, container, parentComponent)
    });
  }

  // 处理 Component 类型
  function processComponent(n1, n2: any, container: any, parentComponent) {
    mountComponent(n2, container, parentComponent)
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
    // 收集依赖
    effect(() => {
      if (!instance.isMounted) {

        const { proxy } = instance

        // 获取 vnode (子组件)
        const subTree = (instance.subTree = instance.render.call(proxy))

        // vnode 树
        // vnode -> path
        // vnode -> element -> mountElement

        patch(null, subTree, container, instance)

        // element -> mount
        initialVNode.el = subTree.el

        instance.isMounted = true
      } else {

        const { proxy } = instance

        // 获取 vnode (子组件)
        const subTree = instance.render.call(proxy)
        const prevSubTree = instance.subTree
        instance.subTree = subTree

        patch(prevSubTree, subTree, container, instance)

        // element -> mount
        // initialVNode.el = subTree.el
      }

    })

  }

  return {
    createApp: createAppAPI(render)
  }
}

