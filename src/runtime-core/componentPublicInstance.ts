const publicPropertiesMap = {
  $el: (i: { vnode: { el: any } }) => i.vnode.el
}
export const PublicInstanceProxyHandlers = {
  get({ _: instance }: any, key: string) {
    // setupState
    const { setupState, props } = instance


    if (key in setupState) {
      return setupState[key]
    }

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