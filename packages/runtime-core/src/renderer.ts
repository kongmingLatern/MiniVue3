import {
  createComponentInstance,
  setupComponent,
} from './component'
import { ShapeFlags, EMPTY_OBJ } from '@mini-vue3/shared'
import { Fragment, Text } from './vnode'
import { createAppAPI } from './createApp'
import { effect } from '@mini-vue3/reactivity'
import { shouldUpdateComponent } from './componentUpdateUtils'
import { queueJobs } from './scheduler'

export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options

  function render(vnode, container) {
    // patch
    patch(null, vnode, container, null, null)
  }

  // patch 函数
  function patch(
    n1: any,
    n2: any,
    container,
    parentComponent: any,
    anchor: any
  ) {
    // 处理组件
    const { shapeFlag, type } = n2
    switch (type) {
      // Fragment
      case Fragment:
        processFlagment(
          n1,
          n2,
          container,
          parentComponent,
          anchor
        )
        break
      // Text 文本
      case Text:
        processText(n1, n2, container)
        break

      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(
            n1,
            n2,
            container,
            parentComponent,
            anchor
          )
          // STATEFUL_COMPONENT
        } else if (
          shapeFlag & ShapeFlags.STATEFUL_COMPONENT
        ) {
          processComponent(
            n1,
            n2,
            container,
            parentComponent,
            anchor
          )
        }
        break
    }
  }

  // 处理 Text 类型
  function processText(n1, n2: any, container: any) {
    const { children } = n2 // string -> 文本
    const textNode = (n2.el =
      document.createTextNode(children))
    container.append(textNode)
  }

  // 处理 Flagment 类型
  function processFlagment(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    mountChildren(
      n2.children,
      container,
      parentComponent,
      anchor
    )
  }

  // 处理 Element 类型
  function processElement(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor: any
  ) {
    if (!n1) {
      // n1 不存在时，说明初始化
      mountElement(n2, container, parentComponent, anchor)
    } else {
      // 否则就是需要 更新
      patchElement(
        n1,
        n2,
        container,
        parentComponent,
        anchor
      )
    }
  }

  function patchElement(
    n1,
    n2,
    container,
    parentComponent,
    anchor
  ) {
    console.log('调用 patchElement')

    const oldProps = n1.props || EMPTY_OBJ
    const newProps = n2.props || EMPTY_OBJ

    const el = (n2.el = n1.el)

    patchChildren(n1, n2, el, parentComponent, anchor)
    patchProps(el, oldProps, newProps)
  }

  function patchChildren(
    n1,
    n2,
    container,
    parentComponent,
    anchor
  ) {
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
        hostSetElementText(container, '')
        // 2. 挂载 Array 类型的 vnode
        mountChildren(
          c2,
          container,
          parentComponent,
          anchor
        )
      } else {
        // Array -> Array Diff
        patchKeyedChildren(
          c1,
          c2,
          container,
          parentComponent,
          anchor
        )
      }
    }
  }
  function patchKeyedChildren(
    c1: any[],
    c2: any[],
    container,
    parentComponent,
    parentAnchor
  ) {
    let i = 0
    const l2 = c2.length
    let e1 = c1.length - 1
    let e2 = l2 - 1

    function isSomeVNodeType(n1, n2) {
      // type 和 key
      return n1.type === n2.type && n1.key === n2.key
    }

    // 左侧
    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]
      // 判断 n1 和 n2 是否一样
      if (isSomeVNodeType(n1, n2)) {
        patch(
          n1,
          n2,
          container,
          parentComponent,
          parentAnchor
        )
      } else {
        break
      }
      i++
    }

    // 右侧
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]

      if (isSomeVNodeType(n1, n2)) {
        patch(
          n1,
          n2,
          container,
          parentComponent,
          parentAnchor
        )
      } else {
        break
      }
      e1--
      e2--
    }
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1
        const anchor =
          nextPos > c1.length ? null : c2[nextPos].el
        // 新的比老的多
        while (i <= e2) {
          patch(
            null,
            c2[i++],
            container,
            parentComponent,
            anchor
          )
        }
      }
    } else if (i > e2) {
      // 老的比新的多
      while (i <= e1) {
        // 删除老的多余的点
        hostRemove(c1[i++].el)
      }
    } else {
      // 乱序部分
      // 中间对比
      let s1 = i
      let s2 = i

      const toBePatched = e2 - s2 + 1
      let patched = 0
      const keyToNewIndexMap = new Map()
      const newIndexToOldIndexMap = new Array(toBePatched)
      let moved = false // 是否需要移动
      let maxNewIndexSoFar = 0
      for (let i = 0; i < toBePatched; i++) {
        newIndexToOldIndexMap[i] = 0 // 值为0说明没有映射关系
      }

      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i]
        keyToNewIndexMap.set(nextChild.key, i)
      }

      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i]

        if (patched >= toBePatched) {
          hostRemove(prevChild.el)
          continue
        }

        let newIndex
        if (prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key)
        } else {
          for (let j = s2; j <= e2; j++) {
            if (isSomeVNodeType(prevChild, c2[j])) {
              newIndex = j
              break
            }
          }
        }
        if (newIndex === undefined) {
          hostRemove(prevChild.el)
        } else {
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex
          } else {
            moved = true
          }
          newIndexToOldIndexMap[newIndex - s2] = i + 1
          patch(
            prevChild,
            c2[newIndex],
            container,
            parentComponent,
            null
          )
          patched++
        }
      }
      // 最长递增
      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : []
      let j = increasingNewIndexSequence.length - 1

      for (let i = toBePatched; i >= 0; i--) {
        const nextIndex = i + s2
        const nextChild = c2[nextIndex]
        const anchor =
          nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null
        if (newIndexToOldIndexMap[i] === 0) {
          patch(
            null,
            nextChild,
            container,
            parentComponent,
            anchor
          )
        } else if (moved) {
          if (
            j < 0 ||
            i !== increasingNewIndexSequence[j]
          ) {
            console.log('移动元素')
            hostInsert(nextChild.el, container, anchor)
          } else {
            j--
          }
        }
      }
    }
  }

  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el // 获取真实DOM元素
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
  function mountElement(
    vnode: any,
    container: any,
    parentComponent,
    anchor
  ) {
    const el = (vnode.el = hostCreateElement(vnode.type))
    // console.log("mountElement");

    // children => string | Array [h(), h()] | "xxx"

    const { children, shapeFlag } = vnode

    // console.log(typeof children); // typeof Array -> Object

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 遍历 children 的每一个节点
      mountChildren(
        vnode.children,
        el,
        parentComponent,
        anchor
      )
    }

    const { props } = vnode

    for (const key in props) {
      // 属性值
      const attrValue = props[key]

      hostPatchProp(el, key, null, attrValue)
    }

    // container.append(el)
    hostInsert(el, container, anchor)
  }

  function mountChildren(
    children: any,
    container: any,
    parentComponent,
    anchor
  ) {
    children.forEach(v => {
      patch(null, v, container, parentComponent, anchor)
    })
  }

  // 处理 Component 类型
  function processComponent(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    if (!n1) {
      mountComponent(n2, container, parentComponent, anchor)
    } else {
      updateComponent(n1, n2)
    }
  }

  function updateComponent(n1, n2) {
    // 去调用当前的 renderer
    const instance = (n2.component = n1.component)
    // 判断 n1 和 n2 是否相等
    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2
      instance.update()
    } else {
      n2.el = n1.el
      n2.vnode = n2
    }
  }

  // 挂载组件
  function mountComponent(
    initialVNode: any,
    container: any,
    parentComponent,
    anchor
  ) {
    // 创建 Component instance 对象
    const instance = (initialVNode.component =
      createComponentInstance(
        initialVNode,
        parentComponent
      ))

    // 设置 instance 的属性
    setupComponent(instance)

    // 生命周期钩子
    setupRenderEffect(
      instance,
      initialVNode,
      container,
      parentComponent,
      anchor
    )
  }

  function setupRenderEffect(
    instance: any,
    initialVNode: any,
    container: any,
    parentComponent,
    anchor
  ) {
    // 收集依赖
    instance.update = effect(
      () => {
        if (!instance.isMounted) {
          const { proxy } = instance

          // 获取 vnode (子组件)
          const subTree = (instance.subTree =
            instance.render.call(proxy, proxy))

          // vnode 树
          // vnode -> path
          // vnode -> element -> mountElement

          patch(null, subTree, container, instance, anchor)

          // element -> mount
          initialVNode.el = subTree.el

          instance.isMounted = true
        } else {
          console.log('更新')
          // 需要一个 vnode
          const { next, vnode } = instance
          if (next) {
            next.el = vnode.el
            updateComponentPreRender(instance, next)
          }
          const { proxy } = instance

          // 获取 vnode (子组件)
          const subTree = instance.render.call(proxy, proxy)
          const prevSubTree = instance.subTree
          instance.subTree = subTree

          patch(
            prevSubTree,
            subTree,
            container,
            instance,
            anchor
          )

          // element -> mount
          // initialVNode.el = subTree.el
        }
      },
      {
        scheduler() {
          console.log('update--scheduler')
          queueJobs(instance.update)
        },
      }
    )
  }

  return {
    createApp: createAppAPI(render),
  }
}
/**
 * 更新当前组件
 * @param instance 当前组件实例
 * @param nextVNode 更新后新的虚拟结点
 */
function updateComponentPreRender(instance, nextVNode) {
  instance.vnode = nextVNode
  instance.next = null
  // 更新props
  instance.props = nextVNode.props
}

/**
 * 最长递增子序列
 * @param arr 数组
 * @returns 返回下标数组
 */
function getSequence(arr: number[]): number[] {
  const p = arr.slice()
  const result = [0]
  let i, j, u, v, c
  const len = arr.length
  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      j = result[result.length - 1]
      if (arr[j] < arrI) {
        p[i] = j
        result.push(i)
        continue
      }
      u = 0
      v = result.length - 1
      while (u < v) {
        c = (u + v) >> 1
        if (arr[result[c]] < arrI) {
          u = c + 1
        } else {
          v = c
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]
        }
        result[u] = i
      }
    }
  }
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}
