'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function toDisplayString(value) {
    return String(value);
}

const extend = Object.assign;
const EMPTY_OBJ = {};
const isObject = (val) => {
    return val !== null && typeof val === 'object';
};
const isString = (val) => typeof val === 'string';
const hasChanged = (oldVal, newVal) => {
    return !Object.is(oldVal, newVal);
};
// add -> Add
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
// Add -> onAdd
const toHandlerKey = (str) => {
    return str ? 'on' + capitalize(str) : '';
};
// add-foo -> addFoo
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, char) => {
        return char ? char.toUpperCase() : '';
    });
};

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        component: null,
        next: null,
        key: props && props.key,
        shapeFlag: getShapeFlag(type),
        el: null,
    };
    if (typeof children === 'string') {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    // 组件 + children object
    if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (typeof children === 'object') {
            vnode.shapeFlag |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function createTextVNode(text, props = {}) {
    return createVNode(Text, props, text);
}
function getShapeFlag(type) {
    return typeof type === 'string'
        ? 1 /* ShapeFlags.ELEMENT */
        : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
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
 * 初始化 instance 的 props 属性
 * @param instance 组件实例
 * @param props 虚拟结点上的 props 属性
 */
function initProps(instance, props) {
    instance.props = props || {};
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
    $props: (i) => i.props
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
    if (!depsMap) {
        // 若不存在依赖，直接返回
        return;
    }
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
function stop(runner) {
    runner.effect.stop();
}
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    extend(_effect, options); // Object.assign => 克隆 options 属性到 _effect 上
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
        if (key === "_v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "_v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
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
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`key: ${key} set failed, because target is readonly!`, target);
        return true;
    },
};
const shalldowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shalldowReadonlyGet,
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
    return !!value["_v_isReactive" /* ReactiveFlags.IS_REACTIVE */];
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
    return !!value["_v_isReadonly" /* ReactiveFlags.IS_READONLY */];
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
        },
    });
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
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    // key -> header | footer
    for (const key in children) {
        const value = children[key];
        // slot
        slots[key] = props => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
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
        emit: () => { },
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
        // 设置当前对象为 instance
        setCurrentInstance(instance);
        const setupResult = setup(shalldowReadonly(instance.props), {
            emit: instance.emit,
        }); // setup() return 的值
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // TODO: function
    if (typeof setupResult === 'object') {
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (compiler && !Component.render) {
        if (Component.template) {
            Component.render = compiler(Component.template);
        }
    }
    // 4.设置 render() 函数
    instance.render = Component.render;
}
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}
let compiler;
function registerRuntimeCompiler(_compiler) {
    compiler = _compiler;
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
            // 把 parentProvides 挂载到 currentInstance.provides 上
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

function shouldUpdateComponent(prevVNode, nextVNode) {
    const { props: prevProps } = prevVNode;
    const { props: nextProps } = nextVNode;
    for (const key in nextProps) {
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
}

const queue = [];
let isFlushPending = false;
const promise = Promise.resolve();
function nextTick(fn) {
    return fn ? promise.then(fn) : promise;
}
function queueJobs(job) {
    if (!queue.includes(job)) {
        queue.push(job);
    }
    queueFlush();
}
function queueFlush() {
    if (isFlushPending) {
        return;
    }
    isFlushPending = true;
    nextTick(flushJobs);
}
function flushJobs() {
    let job;
    isFlushPending = false;
    while (job = queue.shift()) {
        job && job();
    }
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, } = options;
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
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, parentComponent, anchor);
                    // STATEFUL_COMPONENT
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    // 处理 Text 类型
    function processText(n1, n2, container) {
        const { children } = n2; // string -> 文本
        const textNode = (n2.el =
            document.createTextNode(children));
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
        console.log('调用 patchElement');
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
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            // 并且 n1 是 Array 类型
            if (prevShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
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
            if (prevShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                // 1. 清空 Text
                hostSetElementText(container, '');
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
        const l2 = c2.length;
        let e1 = c1.length - 1;
        let e2 = l2 - 1;
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
            const newIndexToOldIndexMap = new Array(toBePatched);
            let moved = false; // 是否需要移动
            let maxNewIndexSoFar = 0;
            for (let i = 0; i < toBePatched; i++) {
                newIndexToOldIndexMap[i] = 0; // 值为0说明没有映射关系
            }
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
                    for (let j = s2; j <= e2; j++) {
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
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
                    patched++;
                }
            }
            // 最长递增
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : [];
            let j = increasingNewIndexSequence.length - 1;
            for (let i = toBePatched; i >= 0; i--) {
                const nextIndex = i + s2;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                if (newIndexToOldIndexMap[i] === 0) {
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                else if (moved) {
                    if (j < 0 ||
                        i !== increasingNewIndexSequence[j]) {
                        console.log('移动元素');
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        j--;
                    }
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
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
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
        if (!n1) {
            mountComponent(n2, container, parentComponent, anchor);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    function updateComponent(n1, n2) {
        // 去调用当前的 renderer
        const instance = (n2.component = n1.component);
        // 判断 n1 和 n2 是否相等
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2;
            instance.update();
        }
        else {
            n2.el = n1.el;
            n2.vnode = n2;
        }
    }
    // 挂载组件
    function mountComponent(initialVNode, container, parentComponent, anchor) {
        // 创建 Component instance 对象
        const instance = (initialVNode.component =
            createComponentInstance(initialVNode, parentComponent));
        // 设置 instance 的属性
        setupComponent(instance);
        // 生命周期钩子
        setupRenderEffect(instance, initialVNode, container, parentComponent, anchor);
    }
    function setupRenderEffect(instance, initialVNode, container, parentComponent, anchor) {
        // 收集依赖
        instance.update = effect(() => {
            if (!instance.isMounted) {
                const { proxy } = instance;
                // 获取 vnode (子组件)
                const subTree = (instance.subTree =
                    instance.render.call(proxy, proxy));
                // vnode 树
                // vnode -> path
                // vnode -> element -> mountElement
                patch(null, subTree, container, instance, anchor);
                // element -> mount
                initialVNode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                console.log('更新');
                // 需要一个 vnode
                const { next, vnode } = instance;
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                const { proxy } = instance;
                // 获取 vnode (子组件)
                const subTree = instance.render.call(proxy, proxy);
                const prevSubTree = instance.subTree;
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance, anchor);
                // element -> mount
                // initialVNode.el = subTree.el
            }
        }, {
            scheduler() {
                console.log('update--scheduler');
                queueJobs(instance.update);
            },
        });
    }
    return {
        createApp: createAppAPI(render),
    };
}
/**
 * 更新当前组件
 * @param instance 当前组件实例
 * @param nextVNode 更新后新的虚拟结点
 */
function updateComponentPreRender(instance, nextVNode) {
    instance.vnode = nextVNode;
    instance.next = null;
    // 更新props
    instance.props = nextVNode.props;
}
/**
 * 最长递增子序列
 * @param arr 数组
 * @returns 返回下标数组
 */
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
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
    setElementText,
});
function createApp(...args) {
    return renderer.createApp(...args);
}

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createApp: createApp,
    toDisplayString: toDisplayString,
    h: h,
    renderSlots: renderSlots,
    createVNode: createVNode,
    createElementVNode: createVNode,
    createTextVNode: createTextVNode,
    getCurrentInstance: getCurrentInstance,
    registerRuntimeCompiler: registerRuntimeCompiler,
    provide: provide,
    inject: inject,
    createRenderer: createRenderer,
    nextTick: nextTick
});

function baseParse(content) {
    const context = createParserContext(content);
    return createRoot(parseChildren(context, []));
}
function parseChildren(context, ancestors) {
    const nodes = [];
    while (!isEnd(context, ancestors)) {
        let node;
        const s = context.source;
        if (s.startsWith("{{")) {
            // 模板 类型
            node = parseInterpolation(context);
        }
        else if (s[0] === "<") {
            // element 类型
            if (/[a-z]/i.test(s[1])) {
                node = parseElement(context, ancestors);
            }
        }
        if (!node) {
            // text 类型
            node = parseText(context);
        }
        nodes.push(node);
    }
    return nodes;
}
function isEnd(context, ancestors) {
    // 2. 遇到结束标签的时候
    const s = context.source;
    // if (parentTag && s.startsWith(`</${parentTag}>`)) {
    //   return true
    // }
    if (s.startsWith("</")) {
        for (let i = ancestors.length - 1; i >= 0; i--) {
            const tag = ancestors[i].tag;
            if (startsWithEndTagOpen(s, tag)) {
                return true;
            }
        }
    }
    // 1. context.source 有值的时候
    return !s;
}
function startsWithEndTagOpen(source, tag) {
    return source.startsWith("</") && source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase();
}
function parseText(context) {
    let endIndex = context.source.length;
    const endTokens = ["<", "{{"];
    // 如果context.source 中含有 {{ ，则只截取到 {{ 之前
    for (let i = 0; i < endTokens.length; i++) {
        const index = context.source.indexOf(endTokens[i]);
        if (index !== -1 && endIndex > index) {
            endIndex = index;
        }
    }
    const content = parseTextData(context, endIndex);
    return {
        type: 3 /* NodeTypes.TEXT */,
        content
    };
}
function parseTextData(context, length) {
    const content = context.source.slice(0, length);
    advanceBy(context, content.length);
    return content;
}
function parseElement(context, ancestors) {
    // 1. 解析 tag -> 正则
    const element = parseTag(context, 0 /* TagType.Start */);
    // console.log("ancestors", ancestors);
    ancestors.push(element);
    element.children = parseChildren(context, ancestors);
    ancestors.pop();
    if (startsWithEndTagOpen(context.source, element.tag)) {
        parseTag(context, 1 /* TagType.End */);
    }
    else {
        throw new Error(`缺少结束标签：${element.tag}`);
    }
    return element;
}
function parseTag(context, type) {
    // 通过正则匹配标签 <div></div> -> match[1] -> div
    const match = /^<\/?([a-z]*)/i.exec(context.source);
    const tag = match[1];
    advanceBy(context, match[0].length);
    advanceBy(context, 1);
    if (type === 1 /* TagType.End */) {
        return;
    }
    return {
        type: 2 /* NodeTypes.ELEMENT */,
        tag
    };
}
function parseInterpolation(context) {
    const openDelimiter = "{{";
    const closeDelimiter = "}}";
    // {{message}} -> message
    // indexOf(参数1，参数2) // 参数2：查找的起始位置
    // const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length)
    // const content = context.source = context.source.slice(openDelimiter.length, closeIndex)
    // console.log(context.source); -> message}}
    // console.log('closeIndex', closeIndex); -> 9
    // console.log(context.source);
    // context.source = context.source.slice(closeIndex + 2)
    const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);
    advanceBy(context, openDelimiter.length);
    const rawContentLength = closeIndex - openDelimiter.length; // 9 - 2 = 7
    const rawcontent = parseTextData(context, rawContentLength); // 获取模板内容 message
    const content = rawcontent.trim();
    advanceBy(context, closeDelimiter.length);
    return {
        type: 0 /* NodeTypes.INTERPOLATION */,
        content: {
            type: 1 /* NodeTypes.SIMPLE_EXPRESSION */,
            content: content
        }
    };
}
function advanceBy(context, length) {
    context.source = context.source.slice(length);
}
function createRoot(children) {
    return {
        children,
        type: 4 /* NodeTypes.ROOT */
    };
}
function createParserContext(content) {
    return {
        source: content
    };
}

const TO_DISPLAY_STRING = Symbol("toDisplayString");
const CREATE_ELEMENT_VNODE = Symbol("createElementVNode");
const helperMapName = {
    [TO_DISPLAY_STRING]: "toDisplayString",
    [CREATE_ELEMENT_VNODE]: "createElementVNode"
};

/**
 * 增删改查节点
 * @param root 根节点
 * @param options 操作函数对象
 */
function transform(root, options = {}) {
    const context = createTransformContext(root, options);
    // 1. 遍历 - 深度优先搜索
    // 2. 修改 text content 的值
    traverseNode(root, context);
    createRootCodegen(root);
    root.helpers = [...context.helpers.keys()];
}
/**
 * TransformContext 初始化
 * @param root 根节点
 * @param options 操作函数
 * @returns 初始化对象
 */
function createTransformContext(root, options) {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helpers: new Map(),
        helper(key) {
            context.helpers.set(key, 1);
        },
    };
    return context;
}
/**
 * 遍历搜索
 * @param node 根节点
 * @param context 插件函数
 */
function traverseNode(node, context) {
    const nodeTransforms = context.nodeTransforms;
    const exitFns = [];
    for (let i = 0; i < nodeTransforms.length; i++) {
        const transformFunction = nodeTransforms[i];
        const onExit = transformFunction(node, context);
        if (onExit) {
            exitFns.push(onExit);
        }
    }
    switch (node.type) {
        case 0 /* NodeTypes.INTERPOLATION */:
            context.helper(TO_DISPLAY_STRING);
            break;
        case 4 /* NodeTypes.ROOT */:
        case 2 /* NodeTypes.ELEMENT */:
            traverseChildren(node, context);
    }
    let i = exitFns.length;
    while (i--) {
        exitFns[i]();
    }
}
/**
 * 深度遍历搜索
 * @param node 节点
 * @param context 操作函数对象
 */
function traverseChildren(node, context) {
    const children = node.children;
    if (children) {
        for (let i = 0; i < children.length; i++) {
            const node = children[i];
            traverseNode(node, context);
        }
    }
}
function createRootCodegen(root) {
    const child = root.children[0];
    if (child.type === 2 /* NodeTypes.ELEMENT */) {
        root.codegenNode = child.codegenNode;
    }
    else {
        root.codegenNode = root.children[0];
    }
}

function transformExpression(node) {
    if (node.type === 0 /* NodeTypes.INTERPOLATION */) {
        node.content = processExpression(node.content);
    }
}
function processExpression(node) {
    node.content = `_ctx.${node.content}`;
    return node;
}

function createVNodeCall(context, tag, props, children) {
    if (context) {
        context.helper(CREATE_ELEMENT_VNODE);
    }
    return {
        type: 2 /* NodeTypes.ELEMENT */,
        tag,
        props,
        children
    };
}

function transformElement(node, context) {
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        return () => {
            // 中间处理
            // tag
            const vnodeTag = `'${node.tag}'`;
            // props
            let vnodeProps;
            // children
            let vnodeChildren = null;
            if (node.children.length > 0) {
                if (node.children.length === 1) {
                    // 只有一个孩子节点 ，那么当生成 render 函数的时候就不用 [] 包裹
                    const child = node.children[0];
                    vnodeChildren = child;
                }
            }
            node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
        };
    }
}

function isText(node) {
    return (node.type === 3 /* NodeTypes.TEXT */ || node.type === 0 /* NodeTypes.INTERPOLATION */);
}

function transformText(node) {
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        return () => {
            const { children } = node;
            let currentContainer;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (isText(child)) {
                    for (let j = i + 1; j < children.length; j++) {
                        const next = children[j];
                        if (isText(next)) {
                            if (!currentContainer) {
                                currentContainer = children[i] = {
                                    type: 5 /* NodeTypes.COMPOUND_EXPRESSION */,
                                    children: [child]
                                };
                            }
                            currentContainer.children.push(" + ");
                            currentContainer.children.push(next);
                            children.splice(j, 1);
                            j--;
                        }
                        else {
                            currentContainer = undefined;
                            break;
                        }
                    }
                }
            }
        };
    }
}

function generate(ast) {
    // return {
    //   code: `
    //     return function render(_ctx, _cache, $props, $setup, $data, $options) {
    //       return "hi"
    //     }
    //   `
    // }
    const context = createCodegenContext();
    const { push } = context;
    genFunctionPreable(ast, context);
    const functionName = 'render';
    const args = ['_ctx', '_cache'];
    const signature = args.join(', ');
    push(`function ${functionName}(${signature}){`);
    push('return ');
    genNode(ast.codegenNode, context);
    push('}');
    return {
        code: context.code,
    };
}
function genFunctionPreable(ast, context) {
    const { push } = context;
    const VueBinging = 'Vue';
    const aliasHelper = s => `${helperMapName[s]}:_${helperMapName[s]}`;
    if (ast.helpers.length > 0) {
        push(`const { ${ast.helpers
            .map(aliasHelper)
            .join(', ')} } = ${VueBinging}`);
    }
    push('\n');
    push('return ');
}
function createCodegenContext() {
    const context = {
        code: '',
        push(source) {
            context.code += source;
        },
        helper(key) {
            return `_${helperMapName[key]}`;
        },
    };
    return context;
}
function genNode(node, context) {
    switch (node.type) {
        case 0 /* NodeTypes.INTERPOLATION */:
            genInterpolation(node, context);
            break;
        case 1 /* NodeTypes.SIMPLE_EXPRESSION */:
            genExpression(node, context);
            break;
        case 2 /* NodeTypes.ELEMENT */:
            genElement(node, context);
            break;
        case 5 /* NodeTypes.COMPOUND_EXPRESSION */:
            genCompoundExpression(node, context);
            break;
        case 3 /* NodeTypes.TEXT */:
            genText(node, context);
            break;
    }
}
function genText(node, context) {
    const { push } = context;
    push(`'${node.content}'`);
}
function genInterpolation(node, context) {
    const { push, helper } = context;
    push(`${helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    push(`)`);
}
function genExpression(node, context) {
    const { push } = context;
    push(`${node.content}`);
}
function genCompoundExpression(node, context) {
    const { push } = context;
    for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (isString(child)) {
            push(child);
        }
        else {
            genNode(child, context);
        }
    }
}
function genElement(node, context) {
    const { push, helper } = context;
    const { tag, children, props } = node;
    push(`${helper(CREATE_ELEMENT_VNODE)}(`);
    genNodeList(genNullable([tag, props, children]), context);
    push(')');
}
function genNodeList(nodes, context) {
    const { push } = context;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (isString(node)) {
            push(`${node}`);
        }
        else {
            genNode(node, context);
        }
        if (i < nodes.length - 1) {
            push(', ');
        }
    }
}
function genNullable(args) {
    let i = args.length;
    while (i--) {
        if (args[i] != null)
            break;
    }
    return args.slice(0, i + 1).map(arg => arg || 'null');
}

function baseCompile(template) {
    const ast = baseParse(template);
    transform(ast, {
        nodeTransforms: [transformExpression, transformElement, transformText]
    });
    return generate(ast);
}

// mini-vue 出口
function compileToFunction(template) {
    const { code } = baseCompile(template);
    const render = new Function("Vue", code)(runtimeDom);
    return render;
}
registerRuntimeCompiler(compileToFunction);

exports.ReactiveEffect = ReactiveEffect;
exports.cleanupEffect = cleanupEffect;
exports.createApp = createApp;
exports.createElementVNode = createVNode;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.createVNode = createVNode;
exports.effect = effect;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.isObject = isObject;
exports.isProxy = isProxy;
exports.isReactive = isReactive;
exports.isReadonly = isReadonly;
exports.isRef = isRef;
exports.isTracking = isTracking;
exports.nextTick = nextTick;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.reactive = reactive;
exports.readonly = readonly;
exports.ref = ref;
exports.registerRuntimeCompiler = registerRuntimeCompiler;
exports.renderSlots = renderSlots;
exports.shalldowReadonly = shalldowReadonly;
exports.stop = stop;
exports.toDisplayString = toDisplayString;
exports.track = track;
exports.trackEffects = trackEffects;
exports.trigger = trigger;
exports.triggerEffects = triggerEffects;
