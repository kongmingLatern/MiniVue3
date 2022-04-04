const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        key: props && props.key,
        shapeFlag: getShapeFlag(type),
        el: null
    };
    if (typeof children === "string") {
        vnode.shapeFlag |= 4 /* TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ARRAY_CHILDREN */;
    }
    // 组件 + children object
    if (vnode.shapeFlag & 2 /* STATEFUL_COMPONENT */) {
        if (typeof children === "object") {
            vnode.shapeFlag |= 16 /* SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function createTextVNode(text, props = {}) {
    return createVNode(Text, props, text);
}
function getShapeFlag(type) {
    return typeof type === "string"
        ? 1 /* ELEMENT */
        : 2 /* STATEFUL_COMPONENT */;
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    console.log(slot);
    if (slot) {
        // function
        if (typeof slot === "function") {
            // Flagment -> 只渲染 children
            // return createVNode("div", {}, slot(props))
            return createVNode(Fragment, {}, slot(props));
        }
    }
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
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        // setupState
        const { setupState, props } = instance;
        if (key in setupState) {
            return setupState[key];
        }
        // hasOwnProperty() 方法会返回一个布尔值，指示对象自身属性中是否具有指定的属性（也就是，是否有指定的键）
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
const EMPTY_OBJ = {};
const isObject = (val) => {
    return val !== null && typeof val === "object";
};
const hasChanged = (oldVal, newVal) => {
    return !Object.is(oldVal, newVal);
};
// add -> Add
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
// Add -> onAdd
const toHandlerKey = (str) => {
    return str ? "on" + capitalize(str) : "";
};
// add-foo -> addFoo
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, char) => {
        return char ? char.toUpperCase() : "";
    });
};

let activeEffect;
let shouldTrack;
const bucket = new Map(); // 存放所有依赖的Map
class ReactiveEffect {
    constructor(_fn, scheduler) {
        this.deps = [];
        this.active = true;
        this._fn = _fn;
        this.scheduler = scheduler;
    }
    run() {
        if (!this.active) {
            return this._fn();
        }
        shouldTrack = true;
        activeEffect = this;
        const result = this._fn();
        // reset
        shouldTrack = false;
        return result;
    }
    stop() {
        if (this.active) {
            // 清除所有依赖
            cleanupEffect(this);
            if (this.onStop) {
                // 有回调就执行回调
                this.onStop();
            }
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}
function track(target, key) {
    if (!isTracking())
        return;
    let depsMap = bucket.get(target); // 尝试从depsMap[Map]中获取depsMap[target] => user
    if (!depsMap) {
        // 不存在，新建一个，然后设置对应字段
        bucket.set(target, (depsMap = new Map()));
    }
    let dep = depsMap.get(key); // 尝试从user[Map]中获取user.key => fn()
    if (!dep) {
        // 若不存在，新建一个Set数据结构，不允许有重复函数
        depsMap.set(key, (dep = new Set()));
    }
    trackEffects(dep);
}
function trackEffects(dep) {
    // 已经在 dep 中
    if (dep.has(activeEffect))
        return;
    // 将fn加入到Set中
    dep.add(activeEffect);
    // 反向收集
    activeEffect.deps.push(dep);
}
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
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
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
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
        if (!isReadonly) {
            track(target, key);
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
function isReactive(value) {
    // return value[ReactiveFlags.IS_REACTIVE] 理应这样写，但是考虑到value可能不是Proxy对象，如果不是 => foo[key] 不会触发 get 操作，因此不会有返回值
    return !!value["_v_isReactive" /* IS_REACTIVE */];
}
function isReadonly(value) {
    // 如果 直接 return value[ReactiveFlags.IS_READONLY] => 会导致 undefined
    /*
      举例：
      const observed = { foo:1, { bar: 2 } }
      isReadonly(observed)
      => value: { foo: 1, { bar: 2 } }
        return observed[ReactiveFlags.IS_READONLY]  =>
    */
    return !!value["_v_isReadonly" /* IS_READONLY */];
}
function isProxy(value) {
    return isReactive(value) || isReadonly(value);
}
function createReactiveObject(target, baseHandlers) {
    if (!isObject(target)) {
        console.warn(`target ${target} is not object!`);
        return;
    }
    return new Proxy(target, baseHandlers);
}

function emit(instance, event) {
    // console.log("event", event); add
    // instance.props -> event
    const { props } = instance;
    // console.log(props);  onAdd
    // 第一种 add -> onAdd
    // add -> Add
    // 第二种 add-foo -> addFoo
    const handler = props[toHandlerKey(camelize(event))];
    // 如果 handler 存在就调用
    handler && handler();
}

function initSlots(instance, children) {
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    // key -> header | footer
    for (const key in children) {
        const value = children[key];
        // slot
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

class RefImp {
    constructor(value) {
        this.__v_isRef = true;
        // _rawValue => 保存
        this._rawValue = value;
        // value 可能是一个对象，如果是，则需要用 reactive 来包裹
        this._value = convert(value);
        this.dep = new Set();
    }
    get value() {
        // 收集依赖
        trackRefValue(this);
        return this._value;
    }
    set value(newVal) {
        // 因为 this._value 可能是一个对象，因此可能会导致 Object 去对比某个值 => 错误
        // 所以需要用另一个变量来保存 this_value
        if (hasChanged(this._rawValue, newVal)) {
            // 如果value值改变，需要重新收集依赖
            this._value = convert(newVal); // 判断 newVal 是否是一个对象，如果是一个对象，则用reactive实现包裹，否则就是单个值
            this._rawValue = newVal; // 重新获取最新设置的值
            triggerEffects(this.dep); // 触发依赖
        }
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.dep);
    }
}
function ref(value) {
    return new RefImp(value);
}
function isRef(ref) {
    return !!ref.__v_isRef;
}
function unRef(ref) {
    // 判断是否是 ref 对象 ? ref.value : value
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objectWithRef) {
    return new Proxy(objectWithRef, {
        get(target, key) {
            // 如果 target[key] 的对象是一个 ref 类型的，返回 .value 否则 返回本身
            return unRef(Reflect.get(target, key));
        },
        set(target, key, newVal) {
            // 如果 target[key] 本身就是一个 ref，并且 newVal 不是一个ref，那么 target[key].value = newVal
            // 如果 target[key] 本身就是一个 ref，并且 newVal 也是一个ref，则进行覆盖
            // 如果 target[key] 不是一个 ref，那么就是重新设置值
            if (isRef(target[key]) && !isRef(newVal)) {
                return (target[key].value = newVal);
            }
            else {
                return Reflect.set(target, key, newVal);
            }
        }
    });
}

let currentInstance = null; // 当前组件实例
function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        slots: {},
        parent,
        provides: parent ? parent.provides : {},
        isMounted: false,
        subTree: {},
        emit: () => { }
    };
    // bind(null, object) => 可以让用户在之后的传参过程中只传入一个值即可
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    // TODO:
    // 1.初始化 props
    initProps(instance, instance.vnode.props);
    // 2.初始化 slots
    initSlots(instance, instance.vnode.children);
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
        setCurrentInstance(instance);
        const setupResult = setup(shalldowReadonly(instance.props), {
            emit: instance.emit
        }); // setup() return 的值
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // TODO: function
    if (typeof setupResult === "object") {
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    // 4.设置 render() 函数
    instance.render = Component.render;
}
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

function provide(key, value) {
    // key foo
    // value fooVal
    // 存
    // 首先获取当前的组件实例
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = currentInstance.parent.provides;
        // init
        if (provides === parentProvides) {
            // Object.create 函数表示 创建原型链
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    // 取
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        // 这里需要提供一个 parent 来指定谁的 provide
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === "function") {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
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
    };
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText } = options;
    function render(vnode, container) {
        // patch
        patch(null, vnode, container, null, null);
    }
    // patch 函数
    function patch(n1, n2, container, parentComponent, anchor) {
        // 处理组件
        const { shapeFlag, type } = n2;
        switch (type) {
            // Fragment
            case Fragment:
                processFlagment(n1, n2, container, parentComponent, anchor);
                break;
            // Text 文本
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ELEMENT */) {
                    processElement(n1, n2, container, parentComponent, anchor);
                    // STATEFUL_COMPONENT
                }
                else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    // 处理 Text 类型
    function processText(n1, n2, container) {
        const { children } = n2; // string -> 文本
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    // 处理 Flagment 类型
    function processFlagment(n1, n2, container, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    // 处理 Element 类型
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            // n1 不存在时，说明初始化
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            // 否则就是需要 更新
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        console.log("调用 patchElement");
        console.log("n1", n1);
        console.log("n2", n2);
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        const el = (n2.el = n1.el);
        patchChildren(n1, n2, el, parentComponent, anchor);
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        // Array -> Text
        // 1. 清除 Array
        // 2. 赋值 Text
        const prevShapeFlag = n1.shapeFlag;
        const { shapeFlag } = n2;
        const c1 = n1.children;
        const c2 = n2.children;
        // 如果 n2 是 Text类型
        if (shapeFlag & 4 /* TEXT_CHILDREN */) {
            // 并且 n1 是 Array 类型
            if (prevShapeFlag & 8 /* ARRAY_CHILDREN */) {
                // 去除 Array
                unmountChildren(n1.children);
                // 设置 text
                // hostSetElementText(container, c2)
            }
            if (c1 !== c2) {
                // Text -> Text || Array -> Text
                hostSetElementText(container, c2);
            }
        }
        else {
            // n2 是 Array 类型
            // Text -> Array
            if (prevShapeFlag & 4 /* TEXT_CHILDREN */) {
                // 1. 清空 Text
                hostSetElementText(container, "");
                // 2. 挂载 Array 类型的 vnode
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                // Array -> Array Diff
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        let i = 0;
        let e1 = c1.length - 1;
        let e2 = c2.length - 1;
        function isSomeVNodeType(n1, n2) {
            // type 和 key
            return n1.type === n2.type && n1.key === n2.key;
        }
        // 左侧
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            // 判断 n1 和 n2 是否一样
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            i++;
        }
        // 右侧
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        if (i > e1) {
            if (i <= e2) {
                const nextPos = e2 + 1;
                const anchor = nextPos > c1.length ? null : c2[nextPos].el;
                // 新的比老的多
                while (i <= e2) {
                    patch(null, c2[i++], container, parentComponent, anchor);
                }
            }
        }
        else if (i > e2) {
            // 老的比新的多
            while (i <= e1) {
                // 删除老的多余的点
                hostRemove(c1[i++].el);
            }
        }
        else {
            // 乱序部分
            // 中间对比
            let s1 = i;
            let s2 = i;
            const toBePatched = e2 - s2 + 1;
            let patched = 0;
            const keyToNewIndexMap = new Map();
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                let newIndex;
                if (prevChild.key != null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    for (let j = s2; j < e2; j++) {
                        if (isSomeVNodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (newIndex === undefined) {
                    hostRemove(prevChild.el);
                }
                else {
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
                    patched++;
                }
            }
        }
    }
    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el; // 获取真实DOM元素
            hostRemove(el);
        }
    }
    function patchProps(el, oldProps, newProps) {
        for (const key in newProps) {
            const prevProp = oldProps[key];
            const nextProp = newProps[key];
            if (prevProp !== nextProp) {
                hostPatchProp(el, key, prevProp, nextProp);
            }
        }
        if (oldProps !== EMPTY_OBJ) {
            for (const key in oldProps) {
                if (!(key in newProps)) {
                    hostPatchProp(el, key, oldProps[key], null);
                }
            }
        }
    }
    // 创建 element 类型
    function mountElement(vnode, container, parentComponent, anchor) {
        const el = (vnode.el = hostCreateElement(vnode.type));
        // console.log("mountElement");
        // children => string | Array [h(), h()] | "xxx"
        const { children, shapeFlag } = vnode;
        // console.log(typeof children); // typeof Array -> Object
        if (shapeFlag & 4 /* TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ARRAY_CHILDREN */) {
            // 遍历 children 的每一个节点
            mountChildren(vnode.children, el, parentComponent, anchor);
        }
        const { props } = vnode;
        for (const key in props) {
            // 属性值
            const attrValue = props[key];
            hostPatchProp(el, key, null, attrValue);
        }
        // container.append(el)
        hostInsert(el, container, anchor);
    }
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach(v => {
            patch(null, v, container, parentComponent, anchor);
        });
    }
    // 处理 Component 类型
    function processComponent(n1, n2, container, parentComponent, anchor) {
        mountComponent(n2, container, parentComponent, anchor);
    }
    // 挂载组件
    function mountComponent(initialVNode, container, parentComponent, anchor) {
        // 创建 Component instance 对象
        const instance = createComponentInstance(initialVNode, parentComponent);
        // 设置 instance 的属性
        setupComponent(instance);
        // 生命周期钩子
        setupRenderEffect(instance, initialVNode, container, parentComponent, anchor);
    }
    function setupRenderEffect(instance, initialVNode, container, parentComponent, anchor) {
        // 收集依赖
        effect(() => {
            if (!instance.isMounted) {
                const { proxy } = instance;
                // 获取 vnode (子组件)
                const subTree = (instance.subTree = instance.render.call(proxy));
                // vnode 树
                // vnode -> path
                // vnode -> element -> mountElement
                patch(null, subTree, container, instance, anchor);
                // element -> mount
                initialVNode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                const { proxy } = instance;
                // 获取 vnode (子组件)
                const subTree = instance.render.call(proxy);
                const prevSubTree = instance.subTree;
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance, anchor);
                // element -> mount
                // initialVNode.el = subTree.el
            }
        });
    }
    return {
        createApp: createAppAPI(render)
    };
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, prevVal, nextVal) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        // 符合 on 开头的特殊 key
        // 绑定事件
        const eventKey = key.slice(2).toLowerCase();
        el.addEventListener(eventKey, nextVal);
    }
    else {
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
function insert(child, parent, anchor) {
    // parent.append(child)
    parent.insertBefore(child, anchor || null);
}
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText
});
function createApp(...args) {
    return renderer.createApp(...args);
}

export { createApp, createRenderer, createTextVNode, createVNode, getCurrentInstance, h, inject, isObject, isProxy, isReactive, isReadonly, isRef, provide, proxyRefs, reactive, readonly, ref, renderSlots, shalldowReadonly };
