# 更新 Element Children (1)

> 这部分为 **核心重点**，也是面试的常见难题之一 ``diff``。

## 引入

> 对于业务逻辑来说，避免不了元素要不断改变，因此，这一块逻辑在 vue 里面也是十分核心的，组件的更新逻辑的性能决定了网页渲染的快慢

## 如何更新？

对于更新 Element 的 children 属性，我们需要考虑以下几种情况：

+ 老的 array， 新的 text
+ 老的 text ，新的 text
+ 老的 text ，新的 array
+ *老的 array， 新的 array（ 难点，在这部分我们先不说 ）

## 实现

### 第一种 ArrayToText

实现逻辑：

> 对于这种情况，我们首先要
>
> **删除 数组的元素**，
>
> 然后设置 **Text 节点**

具体实现：

~~~js
function patchElement(n1, n2, container) {
    const prevProps = n1.props || EMPTY_OBJ
    const nextProps = n2.props || EMPTY_OBJ
    const el = (n2.el = n1.el)
    
    // 更新 children 
    patchChildren(n1, n2, el)
    // 更新 props
    hostPatchProps(prevProps, nextProps)
}

function patchChldren(n1, n2, container) {
    // 区分是哪种类型的对比
    const prevFlag = n1.shapeFlag
    const { shapeFlag, children: c2 } = n2;
    
    // 新的是 文本
    if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 老的是 数组
        if(prevFlag & ShapeFlag.ARRAY_CHILDREN) {
            // 数组 => 文本
            // 删除老节点
            unmountChildren(n1.children)
            // 设置新的节点
            hostSetElementText(c2, container)
        }
    }
}

function unmountChildren(children) {
    for(let i = 0;i < children.length;i ++) {
        const el = children[i].el
        hostRemove(el)
    }
}


// 在 Custome Renderer 中定义 remove  和 setElement 操作
function remove(child) {
    const parent = child.parentNode
    if(parent) {
        parent.removeChild(child)
    }
}

function setElement(textNode, el) {
    el.textContent = textNode
}
~~~

### 第二种 TextToText

实现逻辑：

> 对于这种情况，我们可以先对比两个节点的内容是否相同。
>
> **如果相同，不操作。**
>
> **如果不相同，老节点的文本内容替换成新节点的内容**

具体实现：

~~~ts
function patchChldren(n1, n2, container) {
    // 区分是哪种类型的对比
    const { shapeFlag: prevFlag, children: c1 } = n1.shapeFlag
    const { shapeFlag, children: c2 } = n2;
    
    // 新的是 文本
    if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 老的是 数组
        if(prevFlag & ShapeFlag.ARRAY_CHILDREN) {
            // 数组 => 文本
            // 删除老节点
            unmountChildren(n1.children)
            // 设置新的节点
            hostSetElementText(c2, container)
        } else {
            // 文本 => 文本
            // 判断节点内容是否相同
            if(c1 !== c2) {
                // 替换内容
             hostSetElement(c2, container)      
            }
        }
    }
}
~~~

上面的代码可以进行重构

~~~js
 if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 老的是 数组
        if(prevFlag & ShapeFlag.ARRAY_CHILDREN) {
            // 数组 => 文本
            // 删除老节点
            unmountChildren(n1.children)
        } 
        if(c1 !== c2) {
              // 替换内容
            hostSetElement(c2, container)      
        }
}
~~~

### 第三种 TextToArray

实现逻辑：

> 对于这种情况，我们首先
>
> **清空老节点的内容**
>
> **把新节点的内容 mount 上去**

~~~ts
function patchChldren(n1, n2, container, parentComponent) {
    // 区分是哪种类型的对比
    const { shapeFlag: prevFlag, children: c1 } = n1.shapeFlag
    const { shapeFlag, children: c2 } = n2;
    
    // 新的是 文本
    if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 老的是 数组
        if(prevFlag & ShapeFlag.ARRAY_CHILDREN) {
            // 数组 => 文本
            // 删除老节点
            unmountChildren(n1.children)
            // 设置新的节点
            hostSetElementText(c2, container)
        } else {
            // 文本 => 文本
            // 判断节点内容是否相同
            if(c1 !== c2) {
                // 替换内容
             hostSetElement(c2, container)      
            }
        }
    } else {
        if(prevFlag & ShapeFlags.TEXT_CHILDREN) {
            // 文本 => 数组
            // 清空老节点的内容
            hostSetElement("", container)
            // 把新节点的内容 mount 上去
            mountChildren(c2, container, parentComponent)
        }
    }
}

function mountChildren(children: any, container, parentComponent) {
    children.forEach(v => {
        patch(null, v, container, parentComponent)
    })
}
~~~
