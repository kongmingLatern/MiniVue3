const publicPropertiesMap = {
  $el: (i: { vnode: { el: any } }) => i.vnode.el,
  $slots: (i: { slots: any }) => i.slots
}
export const PublicInstanceProxyHandlers = {
  get({ _: instance }: any, key: string) {
    // setupState
    const { setupState, props } = instance


    if (key in setupState) {
      return setupState[key]
    }
    // hasOwnProperty() 方法会返回一个布尔值，指示对象自身属性中是否具有指定的属性（也就是，是否有指定的键）
    const hasOwn = (val: any, key: any) => Object.prototype.hasOwnProperty.call(val, key)

    if (hasOwn(setupState, key)) {
      return setupState[key]
    } else if (hasOwn(props, key)) {
      return props[key]
    }


    const publicGetter = publicPropertiesMap[key]
    if (publicGetter) {
      return publicGetter(instance)
    }
  }
}