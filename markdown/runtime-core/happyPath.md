# Component 主流程

**流程分为两步**

> 1. 创建 app
> 2. 初始化

## 初始化

在第二步初始化中，我们要

1. 基于 ``rootComponent`` 生成 ``vnode``
2. 通过 ``render`` 来渲染

在使用 ``render `` 渲染的时候要对不同类型的组件进行不同的处理

1. 组件类型
2. 元素类型

## 组件类型

在 **组件类型** 中又分为两种

1. ``mountComponent`` => 初始化组件
2. ``updateComponent`` => 更新组件

### mountComponent

在 **初始化组件** 的时候需要做的步骤：

1. 创建一个组件实例 ``instance``

2. 通过 ``setupComponent`` 来对组件进行初始化

   1. ``initProps`` ，``initSlots`` ，初始化 ``props`` 和 ``slots``
   2. 然后通过 ``setupStatefulComponent`` 来获取 ``App`` 内部 ``setup`` 返回的值
   3. 再通过 ``handleSetupResult`` 来处理 ``setup`` 的返回值
   4. 最后通过 ``finishCompnnentSetup`` 完成组件的 ``setup`` 操作

   **2, 3 步 相当于 调用 ``setup``** 

   **4 步相当于 设置 ``render`` 函数**

3. 最后调用 ``setupRenderEffect`` 来 **渲染挂载** 组件

### updateComponent

在 **更新组件** 的时候需要做的步骤：

1. 先通过 ``shouldUpdateComponent`` **判断组件是否需要更新 [ 对比 `` props`` ]**
2. 如果需要更新，就调用实例上的 ``update`` 方法
3. 然后再通过 ``updateProps`` 和 ``updateSlots`` 对比组件上的 ``props`` 和 ``slots`` 属性是否需要更新
4. 生成最新的 ``subTree``
5. 最后通过 ``patch`` 去处理 ``subTree``

## 元素类型

在 **元素类型** 中也分为两种

1. ``mountElement`` => 初始化 ``element``
2. ``patchElement`` => 更新 ``element`` 

### mountElement

在 **初始化element** 的时候需要做的步骤：

1. 创建真实的 ``element``

2. 处理 ``children`` 节点
   1. 如果是文本类型，调用 ``hostSetElementText`` // 这里的 host 会在 自定义渲染器的时候说
   2. 如果是数组类型，**循环** 调用 ``patch``

3. 调用 ``hostPatchProp`` 设置元素的 ``prop``

4. 触发 ``beforeMount`` 钩子

5. 渲染 ``hostInsert`` **[ 插入真实的 ``DOM`` 树 ]**

6. 触发 ``Mounted`` 钩子

   **后面 3 步 并未在本项目中实现**

### patchElement

在 **更新element** 的时候需要做的步骤：``DIFF``

1. 对比 ``props``
2. 对比 ``children`` 
   1. 通过遍历所有的 ``child`` 递归调用 ``patch``

