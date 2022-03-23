class ReactiveEffect {
  private _fn: any;
  constructor(_fn: any) {
    this._fn = _fn
  }
  run() {
    activeEffect = this
    this._fn()
  }
}
// get 操作 => target => key => dep
/*
  结构
  [target]
      -> [key] 
            -> [fn()]
  ----------第一种情况----------
  effect(function effectFn1() => {
    user.age1
  })
 
  effect(function effectFn2() => {
    user.age1
  })
 
  user
    -> age1
          -> effectFn1
          -> effectFn2
 
  ----------第二种情况----------
  effect(() => {
    user.age1
    user.age2
  })
 
  结构
  [target]
      -> [key] 
            -> [fn()]
 
  user
    -> age1
          -> effect
    -> age2
          -> effect
 
  ----------第三种情况----------
  effect(function effectFn1() => {
    user.age1
  })
 
  effect(function effectFn2() => {
    user.age2
  })
 
  user
    -> age1
          -> effectFn1
    -> age2
          -> effectFn2
 
 
  @params
  target: 当前对象
  key: 字段
*/


const bucket = new Map() // 存放所有依赖的Map
export function track(target: any, key: any) {

  let depsMap = bucket.get(target) // 尝试从depsMap[Map]中获取depsMap[target] => user
  if (!depsMap) {
    // 不存在，新建一个，然后设置对应字段
    bucket.set(target, (depsMap = new Map()))
  }

  let deps = depsMap.get(key) // 尝试从user[Map]中获取user.key => fn()
  if (!deps) {
    // 若不存在，新建一个Set数据结构，不允许有重复函数
    depsMap.set(key, (deps = new Set()))
  }
  // 将fn加入到Set中
  deps.add(activeEffect)
}

export function trigger(target: any, key: any) {
  // 取出 desMap 中的所有依赖
  let depsMap = bucket.get(target)
  if (!depsMap) {
    // 若不存在依赖，直接返回
    return
  }
  // 若存在，则取出对应的字段中依赖并执行
  let deps = depsMap.get(key)
  for (const effect of deps) {
    effect.run()
  }
}


let activeEffect: any
export function effect(fn: any) {
  const _effect = new ReactiveEffect(fn)
  _effect.run()
}