# ShapeFlag

## 疑问

为什么需要 shapeFlag ？

> 答：因为对于传统的 Map 形式 ，key -> value 形式，效率不高，因此需要引入 shapeFlag 概念：**位运算**

什么是位运算？

> 答：& 与操作 和 | 或操作
>
> &:  **两位为1才为1，其余为0** 【可以用于 **查询**】
>
> 0000 & 0001 = 0000
>
> 0000 & 1111 = 0000
>
> 1111 & 1010 = 1010
>
> |: **两位为0时才为0，其余为1**【可以用于 **修改**】
>
> 0000 | 0001 = 0001
>
> 0000 | 0000 = 0000
>
> 1111 | 0000 = 1111

了解了什么是位运算后，我们就可以设计了

创建 ShapeFlags.ts

~~~ts
export const euum ShapeFlags {
    ELEMENT: 1, // 0001 元素类型
   STATEFUL_COMPONENT: 1 << 1,  // 0010 组件类型
    TEXT_CHILDREN: 1 << 2, // 0100 文本类型【children】
    ARRAY_CHILDREN: 1 << 3  // 1000 数组类型【children】
}
~~~

修改 vnode.ts

~~~ts
import { ShapeFlags } from './ShapeFlags.ts'
export function createVNode(type,props, children) {
    const vnode = {
        type,
        props,
        shapeFlag: getShapeFlag(type)
        children,
    }
    if(typeof children === "string") {
        // 修改 【本身的 type 类型 + children 类型】
        // 例如：0101 -> 【ELEMENT 类型，children 文本类型】
        vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN
    } else {
        vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN
    }
    return vnode
}

function getShapeFlag(type: any){
    if(typeof type === "string") {
        return ShapeFlags.ELEMENT
    } else {
        return ShapeFlags.STATEFUL_COMPONENT
    }
}
~~~

修改 renderer.ts

~~~ts
import { ShapeFlags } from './ShapeFlags.ts'
function patch(vnode, container) {
    const { shapeFlag } = vnode
    // 查询 【type 类型 & shapeFlag 类型】
    // 例如：0101 & 0001 -> 0001 【ELEMENT 类型】
    if(shapeFlag & ShapeFlags.ELEMENT) {
        // 元素类型
        processElement(vnode, container)
    } else if(shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        processComponent(vnode, container)
    }
}
~~~

总结：
> shapeFlag 的引入是为了提高效率，十分巧妙！
