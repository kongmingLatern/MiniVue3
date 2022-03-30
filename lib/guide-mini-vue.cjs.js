'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        shapeFlag: getShapeFlag(type),
        el: null
    };
    if (typeof children === "string") {
        vnode.shapeFlag |= 4 /* TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ARRAY_CHILDREN */;
    }
    return vnode;
}
function getShapeFlag(type) {
    return typeof type === "string"
        ? 1 /* ELEMENT */
        : 2 /* STATEFUL_COMPONENT */;
}

/**
 *
 * @param instance 组件实例
 * @param props 虚拟结点上的 props 属性
 */
function initProps(instance, props) {
    instance.props = props || {};
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        // setupState
        const { setupState, props } = instance;
        if (key in setupState) {
            return setupState[key];
        }
        const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

const extend = Object.assign;
const isObject = (val) => {
    return val !== null && typeof val === "object";
};

const bucket = new Map(); // 存放所有依赖的Map
function trigger(target, key) {
    // 取出 desMap 中的所有的 target
    let depsMap = bucket.get(target);
    // if (!depsMap) {
    //   // 若不存在依赖，直接返回
    //   return
    // }
    // 若存在，则取出对应的字段中依赖并执行 user.key => fn()
    let dep = depsMap.get(key);
    // 遍历所有依赖
    triggerEffects(dep);
}
function triggerEffects(deps) {
    for (const effect of deps) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shalldowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, isShallowReadonly = false, isRef = false) {
    return function get(target, key) {
        // 判断 key 是否是 reactive 或 readonly
        if (key === "_v_isReactive" /* IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "_v_isReadonly" /* IS_READONLY */) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        if (isShallowReadonly) {
            return res;
        }
        // 判断 res 是否是一个对象，如果是，给它的内部继续套上 reactive 或 readonly
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`key: ${key} set failed, because target is readonly!`, target);
        return true;
    }
};
const shalldowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shalldowReadonlyGet
});

function reactive(raw) {
    return createReactiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    // 修饰的变量无法被修改
    return createReactiveObject(raw, readonlyHandlers);
}
function shalldowReadonly(raw) {
    return createReactiveObject(raw, shalldowReadonlyHandlers);
}
function createReactiveObject(target, baseHandlers) {
    if (!isObject(target)) {
        console.warn(`target ${target} is not object!`);
        return;
    }
    return new Proxy(target, baseHandlers);
}

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
    initProps(instance, instance.vnode.props);
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
        const setupResult = setup(shalldowReadonly(instance.props)); // setup() return 的值
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
}

function render(vnode, container) {
    // patch
    patch(vnode, container);
}
// patch 函数
function patch(vnode, container) {
    // 处理组件
    const { shapeFlag } = vnode;
    // Element 
    if (shapeFlag & 1 /* ELEMENT */) {
        processElement(vnode, container);
        // STATEFUL_COMPONENT
    }
    else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
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
    // console.log("mountElement");
    // children => string | Array [h(), h()] | "xxx"
    const { children, shapeFlag } = vnode;
    // console.log(typeof children); // typeof Array -> Object
    if (shapeFlag & 4 /* TEXT_CHILDREN */) {
        el.textContent = children;
    }
    else if (shapeFlag & 8 /* ARRAY_CHILDREN */) {
        // 遍历 children 的每一个节点
        children.forEach(v => {
            // 递归的 h
            patch(v, el);
        });
    }
    const { props } = vnode;
    const isOn = (key) => /^on[A-Z]/.test(key);
    for (const key in props) {
        // 属性名
        const attrName = key;
        // 属性值
        const attrValue = props[key];
        if (isOn(attrName)) {
            // 符合 on 开头的特殊 key
            // 绑定事件
            const eventKey = key.slice(2).toLowerCase();
            el.addEventListener(eventKey, attrValue);
        }
        el.setAttribute(attrName, attrValue);
    }
    container.append(el);
}
// 处理 Component 类型
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
// 挂载组件
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
            // 第一次： rootComponent -> App
            /* App.js
              rootComponent : {
                render(),
                setup()
              }
            */
            // 创建根组件
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
