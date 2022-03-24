let activeEffect: any
const bucket = new Map() // 存放所有依赖的Map

class ReactiveEffect {
  private _fn: any;
  public scheduler: Function | undefined
  deps: [] = []
  active: boolean = true
  onStop?: () => void

  constructor(_fn: any, scheduler?: Function) {
    this._fn = _fn
    this.scheduler = scheduler
  }
  run() {
    activeEffect = this
    return this._fn()
  }

  stop() {
    if (this.active) {
      cleanupEffect(this)
      if (this.onStop) {
        this.onStop()
      }
      this.active = false
    }
  }


}

export function cleanupEffect(effect) {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect)
  });
}

export function track(target: any, key: any) {
  if (!activeEffect) return

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
  // 反向收集
  activeEffect.deps.push(deps)
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
    if (effect.scheduler) {
      effect.scheduler()
    } else {
      effect.run()
    }
  }
}

export function stop(runner) {
  runner.effect.stop()
}

export function effect(fn: any, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler)
  _effect.onStop = options.onStop
  _effect.run()

  const runner: any = _effect.run.bind(_effect)
  runner.effect = _effect

  return runner
}


