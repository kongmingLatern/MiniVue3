'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        el: null
    };
    return vnode;
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        // setupState
        const { setupState } = instance;
        if (key in setupState) {
            return setupState[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        proxy: {}
    };
    return component;
}
function setupComponent(instance) {
    // TODO:
    // 1.初始化 props
    // initProps()
    // 2.初始化 slots
    // initSlots()
    // 3.调用 setup()
    // 4.设置 render() 函数
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    // 3.调用 setup()
    const { setup } = Component;
    if (setup) {
        const setupResult = setup();
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // TODO: function
    if (typeof setupResult === "object") {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    // 4.设置 render() 函数
    instance.render = Component.render;
    console.log(instance);
}

const isObject = (val) => {
    return val !== null && typeof val === "object";
};

function render(vnode, container) {
    // patch
    patch(vnode, container);
}
// patch 函数
function patch(vnode, container) {
    // 处理组件
    // 判断 是 Element 还是 Component 
    if (typeof vnode.type === "string") {
        processElement(vnode, container);
    }
    else if (isObject(vnode.type)) {
        processComponent(vnode, container);
    }
}
// 处理 Element 类型
function processElement(vnode, container) {
    mountElement(vnode, container);
}
// 创建 element 类型
function mountElement(vnode, container) {
    const el = (vnode.el = document.createElement(vnode.type));
    console.log("mountElement");
    // children => string | Array [h(), h()] | "xxx"
    const { children } = vnode;
    // console.log(typeof children); // typeof Array -> Object
    if (typeof children === "string") {
        el.textContent = children;
    }
    else if (children instanceof Array) {
        // 遍历 children 的每一个节点
        children.forEach(v => {
            // 递归的 h
            patch(v, el);
        });
    }
    const { props } = vnode;
    for (const key in props) {
        // 属性名
        const attrName = key;
        // 属性值
        const attrValue = props[key];
        el.setAttribute(attrName, attrValue);
    }
    container.append(el);
}
// 处理 Component 类型
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
// 组件初始化
function mountComponent(initialVNode, container) {
    // 创建 Component instance 对象
    const instance = createComponentInstance(initialVNode);
    // 设置 instance 的属性
    setupComponent(instance);
    // 生命周期钩子
    setupRenderEffect(instance, initialVNode, container);
}
function setupRenderEffect(instance, initialVNode, container) {
    const { proxy } = instance;
    console.log(instance.render);
    // 获取 vnode (子组件)
    const subTree = instance.render.call(proxy);
    // vnode 树
    // vnode -> path
    // vnode -> element -> mountElement
    patch(subTree, container);
    // element -> mount
    initialVNode.el = subTree.el;
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // 转为 vnode
            // component -> vnode
            // 所有的逻辑操作 都会基于 rootComponent 生成 vnode -> vnode 处理
            const vnode = createVNode(rootComponent);
            // 渲染
            render(vnode, rootContainer);
        }
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

exports.createApp = createApp;
exports.h = h;
